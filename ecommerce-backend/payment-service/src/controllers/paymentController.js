const axios = require("axios");
const { randomUUID } = require("crypto");
const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");

const sns = new SNSClient({
  region: process.env.AWS_REGION
});

const dynamoDB = require("../config/db");

const {
  PutCommand,
  GetCommand,
  ScanCommand,
  UpdateCommand,
  DeleteCommand
} = require("@aws-sdk/lib-dynamodb");

const TABLE_NAME = process.env.PAYMENT_TABLE;

const getOrderServiceUrl = () => process.env.ORDER_SERVICE_URL;

// ----------------------------------------------------
// POST /api/payments/initiate
// ----------------------------------------------------
const initiatePayment = async (req, res) => {
  try {
    const { orderId, method } = req.body;

    if (!orderId || !method) {
      return res.status(400).json({
        message: "orderId and method are required"
      });
    }

    const validMethods = ["card", "upi", "netbanking", "cod"];
    if (!validMethods.includes(method)) {
      return res.status(400).json({
        message: `Invalid method. Must be one of: ${validMethods.join(", ")}`
      });
    }

    let orderResponse;
    try {
      orderResponse = await axios.get(
        `${getOrderServiceUrl()}/api/orders/${orderId}`
      );
    } catch (err) {
      if (err.response?.status === 404) {
        return res.status(404).json({
          message: "Order not found"
        });
      }

      return res.status(500).json({
        message: err.response?.data?.message || err.message
      });
    }

    const order = orderResponse.data;

    const transaction = {
      transactionId: randomUUID(),
      orderId: order.orderId,
      cartId: order.cartId,
      userId: order.userId || null,
      items: order.items,
      subtotal: order.subtotal,
      shippingCharge: order.shippingCharge,
      amount: order.totalAmount,
      shippingAddress: order.shippingAddress,
      method,
      status: "pending",
      createdAt: new Date().toISOString()
    };

    await dynamoDB.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: transaction
      })
    );

    return res.status(201).json(transaction);
  } catch (error) {
    return res.status(500).json({
      message: error.message
    });
  }
};

// ----------------------------------------------------
// POST /api/payments/confirm
// ----------------------------------------------------
const confirmPayment = async (req, res) => {
  try {
    const { transactionId } = req.body;

    if (!transactionId) {
      return res.status(400).json({
        message: "transactionId is required"
      });
    }

    const data = await dynamoDB.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          transactionId
        }
      })
    );

    const transaction = data.Item;

    if (!transaction) {
      return res.status(404).json({
        message: "Transaction not found"
      });
    }

    if (transaction.status === "success") {
      return res.status(400).json({
        message: "Transaction already confirmed"
      });
    }

    const result = await dynamoDB.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          transactionId
        },
        UpdateExpression: "SET #status = :status, paidAt = :paidAt",
        ExpressionAttributeNames: {
          "#status": "status"
        },
        ExpressionAttributeValues: {
          ":status": "success",
          ":paidAt": new Date().toISOString()
        },
        ReturnValues: "ALL_NEW"
      })
    );

    try {
      const response = await axios.patch(
        `${getOrderServiceUrl()}/api/orders/${transaction.orderId}/pay`
      );
      console.log("Order Updated:", response.data);
    } catch (err) {
      console.error("Order update failed:", err.response?.data || err.message);
      return res.status(500).json({
        message: "Payment confirmed, but order update failed"
      });
    }

    try {
      await sns.send(
        new PublishCommand({
          TopicArn: process.env.SNS_TOPIC_ARN,
          Subject: "Payment Successful",
          Message: `
Hello,

Your payment has been completed successfully.

Transaction ID : ${transactionId}
Order ID       : ${transaction.orderId}
Amount         : ₹${transaction.amount}
Payment Status : Success

Thank you for shopping with us!

Regards,
E-Commerce Team
          `
        })
      );
    } catch (err) {
      console.error("Failed to publish SNS:", err.message);
    }

    return res.json(result.Attributes);
  } catch (error) {
    return res.status(500).json({
      message: error.message
    });
  }
};

// ----------------------------------------------------
// POST /api/payments/fail
// ----------------------------------------------------
const failPayment = async (req, res) => {
  try {
    const { transactionId } = req.body;

    if (!transactionId) {
      return res.status(400).json({
        message: "transactionId is required"
      });
    }

    const data = await dynamoDB.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          transactionId
        }
      })
    );

    if (!data.Item) {
      return res.status(404).json({
        message: "Transaction not found"
      });
    }

    const result = await dynamoDB.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          transactionId
        },
        UpdateExpression: "SET #status = :status",
        ExpressionAttributeNames: {
          "#status": "status"
        },
        ExpressionAttributeValues: {
          ":status": "failed"
        },
        ReturnValues: "ALL_NEW"
      })
    );

    return res.json(result.Attributes);
  } catch (error) {
    return res.status(500).json({
      message: error.message
    });
  }
};

// ----------------------------------------------------
// GET /api/payments/order/:orderId
// ----------------------------------------------------
const getTransactionsByOrderId = async (req, res) => {
  try {
    const data = await dynamoDB.send(
      new ScanCommand({
        TableName: TABLE_NAME
      })
    );

    const transactions = (data.Items || [])
      .filter((item) => item.orderId === req.params.orderId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res.json(transactions);
  } catch (error) {
    return res.status(500).json({
      message: error.message
    });
  }
};

// ----------------------------------------------------
// POST /api/payments
// ----------------------------------------------------
const createPayment = async (req, res) => {
  try {
    const { orderId, amount, method } = req.body;

    if (!orderId || amount === undefined || !method) {
      return res.status(400).json({
        message: "orderId, amount, and method are required"
      });
    }

    const transaction = {
      transactionId: randomUUID(),
      orderId,
      amount,
      method,
      status: req.body.status || "pending",
      paidAt: req.body.paidAt || null,
      createdAt: new Date().toISOString()
    };

    await dynamoDB.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: transaction
      })
    );

    return res.status(201).json(transaction);
  } catch (error) {
    return res.status(500).json({
      message: error.message
    });
  }
};

// ----------------------------------------------------
// GET /api/payments
// ----------------------------------------------------
const getAllPayments = async (req, res) => {
  try {
    const data = await dynamoDB.send(
      new ScanCommand({
        TableName: TABLE_NAME
      })
    );

    let payments = data.Items || [];

    if (req.query.userId) {
      payments = payments.filter(
        (payment) => payment.userId === req.query.userId
      );
    }

    payments = payments.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    return res.json(payments);
  } catch (error) {
    return res.status(500).json({
      message: error.message
    });
  }
};

// ----------------------------------------------------
// GET /api/payments/:id
// ----------------------------------------------------
const getPaymentById = async (req, res) => {
  try {
    const result = await dynamoDB.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          transactionId: req.params.id
        }
      })
    );

    if (!result.Item) {
      return res.status(404).json({
        message: "Payment not found"
      });
    }

    return res.json(result.Item);
  } catch (error) {
    return res.status(500).json({
      message: error.message
    });
  }
};

// ----------------------------------------------------
// PUT /api/payments/:id
// ----------------------------------------------------
const updatePayment = async (req, res) => {
  try {
    const transactionId = req.params.id;

    const existing = await dynamoDB.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          transactionId
        }
      })
    );

    if (!existing.Item) {
      return res.status(404).json({
        message: "Payment not found"
      });
    }

    const updates = req.body;
    const keys = Object.keys(updates);

    if (keys.length === 0) {
      return res.status(400).json({
        message: "No updates provided"
      });
    }

    let updateExpression = "SET ";
    const ExpressionAttributeNames = {};
    const ExpressionAttributeValues = {};

    keys.forEach((key, index) => {
      updateExpression += `#${key} = :${key}`;
      if (index !== keys.length - 1) {
        updateExpression += ", ";
      }
      ExpressionAttributeNames[`#${key}`] = key;
      ExpressionAttributeValues[`:${key}`] = updates[key];
    });

    const result = await dynamoDB.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          transactionId
        },
        UpdateExpression: updateExpression,
        ExpressionAttributeNames,
        ExpressionAttributeValues,
        ReturnValues: "ALL_NEW"
      })
    );

    return res.json(result.Attributes);
  } catch (error) {
    return res.status(500).json({
      message: error.message
    });
  }
};

// ----------------------------------------------------
// DELETE /api/payments/:id
// ----------------------------------------------------
const deletePayment = async (req, res) => {
  try {
    const transactionId = req.params.id;

    const existing = await dynamoDB.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          transactionId
        }
      })
    );

    if (!existing.Item) {
      return res.status(404).json({
        message: "Payment not found"
      });
    }

    await dynamoDB.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: {
          transactionId
        }
      })
    );

    return res.json({
      message: "Payment deleted successfully"
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message
    });
  }
};

module.exports = {
  initiatePayment,
  confirmPayment,
  failPayment,
  getTransactionsByOrderId,
  createPayment,
  getAllPayments,
  getPaymentById,
  updatePayment,
  deletePayment
};  
