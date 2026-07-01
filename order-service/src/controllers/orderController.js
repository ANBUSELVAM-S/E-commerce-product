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

// Helper to get service URLs
const getCartServiceUrl = () =>
  process.env.CART_SERVICE_URL || "http://localhost:5002";

const getProductServiceUrl = () =>
  process.env.PRODUCT_SERVICE_URL || "http://localhost:5001";

// =====================================================
// CREATE ORDER
// POST /api/orders
// =====================================================

const createOrder = async (req, res) => {
  try {
    const { cartId, shippingAddress } = req.body;

    if (!cartId || !shippingAddress) {
      return res.status(400).json({
        message: "cartId and shippingAddress are required",
      });
    }

    // Get cart details
    let cartResponse;

    try {
      cartResponse = await axios.get(
        `${getCartServiceUrl()}/api/cart/${cartId}/summary`
      );
    } catch (err) {
      if (err.response && err.response.status === 404) {
        return res.status(404).json({
          message: "Cart not found",
        });
      }

      throw new Error(`Failed to fetch cart: ${err.message}`);
    }

    const cartData = cartResponse.data;

    // Validate cart
    if (!cartData.items || cartData.items.length === 0) {
      return res.status(400).json({
        message: "Cart is empty",
      });
    }

    const subtotal = cartData.subtotal;
    const shippingCharge = 50;
    const totalAmount = subtotal + shippingCharge;

    const order = {
      orderId: randomUUID(),
      cartId,
      items: cartData.items,
      subtotal,
      shippingCharge,
      totalAmount,
      shippingAddress,
      status: "pending",
      paymentStatus: "unpaid",
      createdAt: new Date().toISOString(),
    };

    await dynamoDB.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: order,
      })
    );

    // Update Product Stock
    try {
      const productPromises = cartData.items.map((item) =>
        axios.patch(
          `${getProductServiceUrl()}/api/products/${item.productId}/stock`,
          {
            decrement: item.quantity,
          }
        )
      );

      await Promise.all(productPromises);
    } catch (err) {
      console.error("Failed to update product stock:", err.message);
    }

    // Clear Cart
    try {
      await axios.delete(
        `${getCartServiceUrl()}/api/cart/${cartId}/clear`
      );
    } catch (err) {
      console.error("Failed to clear cart:", err.message);
    }

    return res.status(201).json(order);
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

// =====================================================
// GET ALL ORDERS
// GET /api/orders
// =====================================================

const getOrders = async (req, res) => {
  try {
    const result = await dynamoDB.send(
      new ScanCommand({
        TableName: TABLE_NAME,
      })
    );

    let orders = result.Items || [];

    if (req.query.status) {
      orders = orders.filter(
        (order) => order.status === req.query.status
      );
    }

    orders.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    return res.json(orders);
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

// =====================================================
// GET ORDER BY ID
// GET /api/orders/:id
// =====================================================

const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await dynamoDB.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          orderId: id,
        },
      })
    );

    if (!result.Item) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    return res.json(result.Item);
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

// =====================================================
// DELETE ORDER
// DELETE /api/orders/:id
// =====================================================

const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await dynamoDB.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          orderId: id,
        },
      })
    );

    if (!existing.Item) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    await dynamoDB.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: {
          orderId: id,
        },
      })
    );

    return res.json({
      message: "Order deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

// =====================================================
// CANCEL ORDER
// PUT /api/orders/:id/cancel
// =====================================================

const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await dynamoDB.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          orderId: id,
        },
      })
    );

    const order = result.Item;

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    if (order.status !== "pending") {
      return res.status(400).json({
        message: `Cannot cancel order with status: ${order.status}`,
      });
    }

    const updated = await dynamoDB.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          orderId: id,
        },
        UpdateExpression: "SET #status = :status",
        ExpressionAttributeNames: {
          "#status": "status",
        },
        ExpressionAttributeValues: {
          ":status": "cancelled",
        },
        ReturnValues: "ALL_NEW",
      })
    );

    return res.json(updated.Attributes);
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

// =====================================================
// PAY ORDER
// PATCH /api/orders/:orderId/pay
// =====================================================

const payOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const result = await dynamoDB.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          orderId,
        },
      })
    );

    if (!result.Item) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    const updated = await dynamoDB.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          orderId,
        },
        UpdateExpression:
          "SET paymentStatus = :paid, #status = :confirmed",
        ExpressionAttributeNames: {
          "#status": "status",
        },
        ExpressionAttributeValues: {
          ":paid": "paid",
          ":confirmed": "confirmed",
        },
        ReturnValues: "ALL_NEW",
      })
    );

    return res.json(updated.Attributes);
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  deleteOrder,
  cancelOrder,
  payOrder,
};