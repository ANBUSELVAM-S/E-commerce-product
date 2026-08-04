const axios = require("axios");
const { randomUUID } = require("crypto");

const dynamoDB = require("../config/db");

const {
  PutCommand,
  GetCommand,
  ScanCommand,
  UpdateCommand,
  DeleteCommand
} = require("@aws-sdk/lib-dynamodb");

const TABLE_NAME = process.env.ORDER_TABLE;

// ----------------------------------------------------
// SERVICE URL HELPERS
// ----------------------------------------------------
const getCartServiceUrl = () =>
  process.env.CART_SERVICE_URL;

const getInventoryServiceUrl = () =>
  process.env.INVENTORY_SERVICE_URL;

// ----------------------------------------------------
// COMMON HELPERS
// ----------------------------------------------------
const normalizeServiceUrl = (
  serviceUrl,
  variableName
) => {
  if (!serviceUrl) {
    throw new Error(
      `${variableName} environment variable is not configured`
    );
  }

  return serviceUrl.replace(/\/+$/, "");
};

const validateOrderTable = () => {
  if (!TABLE_NAME) {
    throw new Error(
      "ORDER_TABLE environment variable is not configured"
    );
  }
};

const getUserGroups = (user) => {
  if (!user) {
    return [];
  }

  const groups =
    user.groups ??
    user["cognito:groups"] ??
    [];

  if (Array.isArray(groups)) {
    return groups;
  }

  if (typeof groups === "string") {
    try {
      const parsedGroups = JSON.parse(groups);

      if (Array.isArray(parsedGroups)) {
        return parsedGroups;
      }
    } catch {
      return groups
        .split(",")
        .map((group) => group.trim())
        .filter(Boolean);
    }
  }

  return [];
};

const isAdminUser = (user) => {
  return getUserGroups(user).includes("admin");
};

const getAxiosConfig = (req) => {
  const authorization =
    req.headers?.authorization ||
    req.headers?.Authorization;

  return {
    headers: authorization
      ? {
          Authorization: authorization
        }
      : {},
    timeout: 5000
  };
};

const canAccessOrder = (req, order) => {
  if (!req.user) {
    return true;
  }

  if (isAdminUser(req.user)) {
    return true;
  }

  return order.userId === req.user.sub;
};

const handleServerError = (
  res,
  operation,
  error
) => {
  console.error(`${operation} ERROR:`, {
    name: error.name,
    message: error.message,
    code: error.code,
    status: error.response?.status,
    response: error.response?.data,
    url: error.config?.url,
    stack: error.stack
  });

  return res.status(500).json({
    message:
      error.response?.data?.message ||
      error.message ||
      `${operation} failed`
  });
};

// ----------------------------------------------------
// CREATE ORDER
// POST /api/orders
// ----------------------------------------------------
const createOrder = async (req, res) => {
  try {
    validateOrderTable();

    const {
      cartId,
      shippingAddress,
      userId: bodyUserId
    } = req.body || {};

    console.log("CREATE ORDER REQUEST:", {
      cartId,
      bodyUserId,
      authenticatedUserId: req.user?.sub,
      groups: getUserGroups(req.user),
      hasShippingAddress:
        Boolean(shippingAddress)
    });

    if (!cartId || !shippingAddress) {
      return res.status(400).json({
        message:
          "cartId and shippingAddress are required"
      });
    }

    const isAdmin = isAdminUser(req.user);

    /*
     * Normal authenticated user:
     * Use Cognito sub.
     *
     * Admin user:
     * Can send userId in the request body.
     *
     * When authentication middleware is not used:
     * Use userId from the request body.
     */
    const userId = req.user?.sub
      ? isAdmin && bodyUserId
        ? bodyUserId
        : req.user.sub
      : bodyUserId || null;

    if (!userId) {
      return res.status(400).json({
        message: "userId is required"
      });
    }

    // Normal users can only order from their own cart
    if (
      req.user &&
      !isAdmin &&
      cartId !== `cart_${userId}`
    ) {
      return res.status(403).json({
        message:
          "Forbidden: You can only checkout your own cart"
      });
    }

    const cartServiceUrl =
      normalizeServiceUrl(
        getCartServiceUrl(),
        "CART_SERVICE_URL"
      );

    const requestConfig =
      getAxiosConfig(req);

    // ------------------------------------------------
    // FETCH CART SUMMARY
    // ------------------------------------------------
    let cartResponse;

    try {
      const cartSummaryUrl =
        `${cartServiceUrl}/api/cart/` +
        `${encodeURIComponent(cartId)}/summary`;

      console.log(
        "FETCHING CART SUMMARY:",
        cartSummaryUrl
      );

      cartResponse = await axios.get(
        cartSummaryUrl,
        requestConfig
      );
    } catch (error) {
      console.error("CART SERVICE ERROR:", {
        message: error.message,
        status: error.response?.status,
        response: error.response?.data,
        url: error.config?.url
      });

      if (error.response?.status === 400) {
        return res.status(400).json({
          message:
            error.response?.data?.message ||
            "Invalid cart request"
        });
      }

      if (error.response?.status === 401) {
        return res.status(401).json({
          message:
            "Unauthorized while accessing cart service"
        });
      }

      if (error.response?.status === 403) {
        return res.status(403).json({
          message:
            "Forbidden while accessing cart service"
        });
      }

      if (error.response?.status === 404) {
        return res.status(404).json({
          message: "Cart not found"
        });
      }

      throw new Error(
        `Failed to fetch cart: ${
          error.response?.data?.message ||
          error.message
        }`
      );
    }

    const cartData = cartResponse.data;

    if (!cartData) {
      throw new Error(
        "Cart service returned an empty response"
      );
    }

    if (!Array.isArray(cartData.items)) {
      throw new Error(
        "Cart service returned invalid cart items"
      );
    }

    if (cartData.items.length === 0) {
      return res.status(400).json({
        message: "Cart is empty"
      });
    }

    // ------------------------------------------------
    // VALIDATE CART ITEMS
    // ------------------------------------------------
    for (const item of cartData.items) {
      if (!item.productId) {
        return res.status(400).json({
          message:
            "One or more cart items are missing productId"
        });
      }

      const quantity = Number(item.quantity);

      if (
        !Number.isFinite(quantity) ||
        quantity <= 0
      ) {
        return res.status(400).json({
          message:
            `Invalid quantity for product ${item.productId}`
        });
      }
    }

    // ------------------------------------------------
    // CALCULATE ORDER TOTAL
    // ------------------------------------------------
    const subtotal = Number(
      cartData.subtotal
    );

    if (!Number.isFinite(subtotal)) {
      throw new Error(
        `Invalid cart subtotal: ${cartData.subtotal}`
      );
    }

    const shippingCharge = 50;
    const totalAmount =
      subtotal + shippingCharge;

    const order = {
      orderId: randomUUID(),
      cartId,
      userId,
      items: cartData.items,
      subtotal,
      shippingCharge,
      totalAmount,
      shippingAddress,
      status: "pending",
      paymentStatus: "unpaid",
      createdAt: new Date().toISOString()
    };

    // ------------------------------------------------
    // SAVE ORDER IN DYNAMODB
    // ------------------------------------------------
    try {
      await dynamoDB.send(
        new PutCommand({
          TableName: TABLE_NAME,
          Item: order
        })
      );

      console.log(
        "ORDER SAVED SUCCESSFULLY:",
        order.orderId
      );
    } catch (error) {
      console.error("DYNAMODB PUT ERROR:", {
        name: error.name,
        message: error.message,
        tableName: TABLE_NAME
      });

      throw new Error(
        `Failed to save order: ${error.message}`
      );
    }

    // ------------------------------------------------
    // UPDATE INVENTORY
    // ------------------------------------------------
    try {
      const inventoryServiceUrl =
        normalizeServiceUrl(
          getInventoryServiceUrl(),
          "INVENTORY_SERVICE_URL"
        );

      const inventoryPromises =
        cartData.items.map((item) => {
          const inventoryUrl =
            `${inventoryServiceUrl}/api/inventory/` +
            `${encodeURIComponent(item.productId)}/adjust`;

          return axios.patch(
            inventoryUrl,
            {
              type: "removal",
              quantity: Number(item.quantity),
              reason:
                `Order ${order.orderId}`
            },
            requestConfig
          );
        });

      await Promise.all(inventoryPromises);

      console.log(
        "INVENTORY UPDATED SUCCESSFULLY"
      );
    } catch (error) {
      /*
       * The order has already been created.
       * Inventory failure is logged but does not
       * return a 500 response to the customer.
       */
      console.error(
        "INVENTORY UPDATE FAILED:",
        {
          message: error.message,
          status: error.response?.status,
          response: error.response?.data,
          url: error.config?.url
        }
      );
    }

    // ------------------------------------------------
    // CLEAR CART
    // ------------------------------------------------
    try {
      const clearCartUrl =
        `${cartServiceUrl}/api/cart/` +
        `${encodeURIComponent(cartId)}/clear`;

      await axios.delete(
        clearCartUrl,
        requestConfig
      );

      console.log(
        "CART CLEARED SUCCESSFULLY:",
        cartId
      );
    } catch (error) {
      /*
       * The order has already been created.
       * Cart-clear failure is logged but does not
       * return a 500 response.
       */
      console.error("CART CLEAR FAILED:", {
        message: error.message,
        status: error.response?.status,
        response: error.response?.data,
        url: error.config?.url
      });
    }

    return res.status(201).json(order);
  } catch (error) {
    return handleServerError(
      res,
      "CREATE ORDER",
      error
    );
  }
};

// ----------------------------------------------------
// GET ALL ORDERS
// GET /api/orders
// ----------------------------------------------------
const getOrders = async (req, res) => {
  try {
    validateOrderTable();

    const result = await dynamoDB.send(
      new ScanCommand({
        TableName: TABLE_NAME
      })
    );

    let orders = result.Items || [];

    if (req.query.status) {
      orders = orders.filter(
        (order) =>
          order.status === req.query.status
      );
    }

    const isAdmin =
      isAdminUser(req.user);

    /*
     * Normal authenticated users:
     * View only their own orders.
     *
     * Admin users:
     * Can view all orders or filter by userId.
     */
    const targetUserId =
      req.user && !isAdmin
        ? req.user.sub
        : req.query.userId;

    if (targetUserId) {
      orders = orders.filter(
        (order) =>
          order.userId === targetUserId
      );
    }

    orders.sort(
      (firstOrder, secondOrder) =>
        new Date(secondOrder.createdAt) -
        new Date(firstOrder.createdAt)
    );

    return res.status(200).json(orders);
  } catch (error) {
    return handleServerError(
      res,
      "GET ORDERS",
      error
    );
  }
};

// ----------------------------------------------------
// GET ORDER BY ID
// GET /api/orders/:id
// ----------------------------------------------------
const getOrderById = async (
  req,
  res
) => {
  try {
    validateOrderTable();

    const orderId = req.params.id;

    if (!orderId) {
      return res.status(400).json({
        message: "orderId is required"
      });
    }

    const result = await dynamoDB.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          orderId
        }
      })
    );

    if (!result.Item) {
      return res.status(404).json({
        message: "Order not found"
      });
    }

    if (!canAccessOrder(req, result.Item)) {
      return res.status(403).json({
        message:
          "Forbidden: You cannot access this order"
      });
    }

    return res.status(200).json(
      result.Item
    );
  } catch (error) {
    return handleServerError(
      res,
      "GET ORDER",
      error
    );
  }
};

// ----------------------------------------------------
// DELETE ORDER
// DELETE /api/orders/:id
// ----------------------------------------------------
const deleteOrder = async (
  req,
  res
) => {
  try {
    validateOrderTable();

    const orderId = req.params.id;

    if (!orderId) {
      return res.status(400).json({
        message: "orderId is required"
      });
    }

    const existing = await dynamoDB.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          orderId
        }
      })
    );

    if (!existing.Item) {
      return res.status(404).json({
        message: "Order not found"
      });
    }

    if (!canAccessOrder(req, existing.Item)) {
      return res.status(403).json({
        message:
          "Forbidden: You cannot delete this order"
      });
    }

    await dynamoDB.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: {
          orderId
        }
      })
    );

    return res.status(200).json({
      message: "Order deleted successfully"
    });
  } catch (error) {
    return handleServerError(
      res,
      "DELETE ORDER",
      error
    );
  }
};

// ----------------------------------------------------
// CANCEL ORDER
// PUT /api/orders/:id/cancel
// ----------------------------------------------------
const cancelOrder = async (
  req,
  res
) => {
  try {
    validateOrderTable();

    const orderId = req.params.id;

    if (!orderId) {
      return res.status(400).json({
        message: "orderId is required"
      });
    }

    const existing = await dynamoDB.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          orderId
        }
      })
    );

    if (!existing.Item) {
      return res.status(404).json({
        message: "Order not found"
      });
    }

    if (!canAccessOrder(req, existing.Item)) {
      return res.status(403).json({
        message:
          "Forbidden: You cannot cancel this order"
      });
    }

    if (existing.Item.status !== "pending") {
      return res.status(400).json({
        message:
          `Cannot cancel order with status: ` +
          `${existing.Item.status}`
      });
    }

    const result = await dynamoDB.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          orderId
        },
        UpdateExpression:
          "SET #status = :status",
        ExpressionAttributeNames: {
          "#status": "status"
        },
        ExpressionAttributeValues: {
          ":status": "cancelled"
        },
        ReturnValues: "ALL_NEW"
      })
    );

    return res.status(200).json(
      result.Attributes
    );
  } catch (error) {
    return handleServerError(
      res,
      "CANCEL ORDER",
      error
    );
  }
};

// ----------------------------------------------------
// PAY ORDER
// PATCH /api/orders/:orderId/pay
// ----------------------------------------------------
const payOrder = async (
  req,
  res
) => {
  try {
    validateOrderTable();

    const orderId =
      req.params.orderId;

    console.log(
      "PAY ORDER REQUEST:",
      orderId
    );

    if (!orderId) {
      return res.status(400).json({
        message: "orderId is required"
      });
    }

    const existing = await dynamoDB.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          orderId
        }
      })
    );

    if (!existing.Item) {
      return res.status(404).json({
        message: "Order not found"
      });
    }

    if (!canAccessOrder(req, existing.Item)) {
      return res.status(403).json({
        message:
          "Forbidden: You cannot pay for this order"
      });
    }

    if (
      existing.Item.status === "cancelled"
    ) {
      return res.status(400).json({
        message:
          "Cancelled orders cannot be paid"
      });
    }

    if (
      existing.Item.paymentStatus === "paid"
    ) {
      return res.status(400).json({
        message:
          "Order has already been paid"
      });
    }

    const result = await dynamoDB.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          orderId
        },
        UpdateExpression:
          "SET paymentStatus = :paymentStatus, " +
          "#status = :status",
        ExpressionAttributeNames: {
          "#status": "status"
        },
        ExpressionAttributeValues: {
          ":paymentStatus": "paid",
          ":status": "confirmed"
        },
        ReturnValues: "ALL_NEW"
      })
    );

    console.log(
      "ORDER PAYMENT UPDATED:",
      orderId
    );

    return res.status(200).json(
      result.Attributes
    );
  } catch (error) {
    return handleServerError(
      res,
      "PAY ORDER",
      error
    );
  }
};

// ----------------------------------------------------
// EXPORTS
// ----------------------------------------------------
module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  deleteOrder,
  cancelOrder,
  payOrder
};