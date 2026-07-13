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

// Helper URLs
const getCartServiceUrl = () => process.env.CART_SERVICE_URL;
const getProductServiceUrl = () => process.env.PRODUCT_SERVICE_URL;
const getInventoryServiceUrl = () =>
  process.env.INVENTORY_SERVICE_URL;

// ----------------------------------------------------
// CREATE ORDER
// POST /api/orders
// ----------------------------------------------------
const createOrder = async (req, res) => {
  try {
    const { cartId, shippingAddress } = req.body;

    if (!cartId || !shippingAddress) {
      return res.status(400).json({
        message: "cartId and shippingAddress are required"
      });
    }

    // Fetch Cart Summary
    let cartResponse;

    try {
      cartResponse = await axios.get(
        `${getCartServiceUrl()}/api/cart/${cartId}/summary`
      );
    } catch (err) {
      if (err.response && err.response.status === 404) {
        return res.status(404).json({
          message: "Cart not found"
        });
      }

      throw new Error(`Failed to fetch cart: ${err.message}`);
    }

    const cartData = cartResponse.data;

    if (!cartData.items || cartData.items.length === 0) {
      return res.status(400).json({
        message: "Cart is empty"
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
      createdAt: new Date().toISOString()
    };

    await dynamoDB.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: order
      })
    );

    // Update Product Stock
    const inventoryPromises = cartData.items.map(item =>
      axios.patch(
        
          `${getInventoryServiceUrl()}/api/inventory/${item.productId}/adjust`,
          {
              type: "removal",
              quantity: item.quantity,
              reason: `Order ${order.orderId}`
          }
      )
  );
  
  try {
      await Promise.all(inventoryPromises);
      console.log("Inventory Updated");
  } catch (err) {
      console.error("Inventory Update Failed:", err.response?.data || err.message);
  }

    // Clear Cart
    try {
      await axios.delete(
        `${getCartServiceUrl()}/api/cart/${cartId}/clear`
      );
    } catch (err) {
      console.error("Failed to clear cart:", err.message);
    }

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// ----------------------------------------------------
// GET ALL ORDERS
// ----------------------------------------------------
const getOrders = async (req, res) => {
  try {
    const result = await dynamoDB.send(
      new ScanCommand({
        TableName: TABLE_NAME
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

    res.json(orders);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// ----------------------------------------------------
// GET ORDER BY ID
// ----------------------------------------------------
const getOrderById = async (req, res) => {
  try {
    const result = await dynamoDB.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          orderId: req.params.id
        }
      })
    );

    if (!result.Item) {
      return res.status(404).json({
        message: "Order not found"
      });
    }

    res.json(result.Item);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// ----------------------------------------------------
// DELETE ORDER
// DELETE /api/orders/:id
// ----------------------------------------------------
const deleteOrder = async (req, res) => {
  try {
    const orderId = req.params.id;

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

    await dynamoDB.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: {
          orderId
        }
      })
    );

    res.json({
      message: "Order deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// ----------------------------------------------------
// CANCEL ORDER
// PUT /api/orders/:id/cancel
// ----------------------------------------------------
const cancelOrder = async (req, res) => {
  try {
    const orderId = req.params.id;

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

    if (existing.Item.status !== "pending") {
      return res.status(400).json({
        message: `Cannot cancel order with status: ${existing.Item.status}`
      });
    }

    const result = await dynamoDB.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          orderId
        },
        UpdateExpression: "SET #status = :status",
        ExpressionAttributeNames: {
          "#status": "status"
        },
        ExpressionAttributeValues: {
          ":status": "cancelled"
        },
        ReturnValues: "ALL_NEW"
      })
    );

    res.json(result.Attributes);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// ----------------------------------------------------
// PAY ORDER
// PATCH /api/orders/:orderId/pay
// ----------------------------------------------------
const payOrder = async (req, res) => {
  try {
    console.log("Inside payOrder");
    console.log("Params:", req.params);

    const orderId = req.params.orderId;

    console.log("Order ID:", orderId);

    const existing = await dynamoDB.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          orderId
        }
      })
    );

    console.log("Existing Order:", existing);

    if (!existing.Item) {
      return res.status(404).json({
        message: "Order not found"
      });
    }

    const result = await dynamoDB.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          orderId
        },
        UpdateExpression:
          "SET paymentStatus = :paymentStatus, #status = :status",
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

    console.log("Updated Order:", result);

    res.json(result.Attributes);
  } catch (error) {
    console.error("payOrder Error:", error);

    res.status(500).json({
      message: error.message
    });
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