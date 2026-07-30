const { randomUUID } = require("crypto");

const dynamoDB = require("../config/db");

const {
  PutCommand,
  GetCommand,
  ScanCommand,
  UpdateCommand,
  DeleteCommand
} = require("@aws-sdk/lib-dynamodb");

const TABLE_NAME = process.env.NOTIFICATION_TABLE;

const sqs = require("../config/sqs");

const {
    
    ReceiveMessageCommand,
    DeleteMessageCommand
} = require("@aws-sdk/client-sqs");



// ------------------------------------
// CREATE Notification
// POST /api/notifications
// ------------------------------------
const createNotification = async (req, res) => {
  try {

    const notification = {
      notificationId: randomUUID(),
      userId: req.body.userId,
      title: req.body.title,
      message: req.body.message,
      type: req.body.type,
      isRead: false,
      createdAt: new Date().toISOString()
    };

    await dynamoDB.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: notification
      })
    );

    res.status(201).json(notification);

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// ------------------------------------
// GET ALL Notifications
// ------------------------------------
const getAllNotifications = async (req, res) => {

  try {

    const result = await dynamoDB.send(
      new ScanCommand({
        TableName: TABLE_NAME
      })
    );

    let notifications = result.Items || [];

    const { userId, type, isRead } = req.query;

    if (userId) {
      notifications = notifications.filter(
        n => n.userId === userId
      );
    }

    if (type) {
      notifications = notifications.filter(
        n => n.type === type
      );
    }

    if (isRead !== undefined) {
      notifications = notifications.filter(
        n => n.isRead === (isRead === "true")
      );
    }

    notifications.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    res.json(notifications);

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }

};


const receiveNotifications = async (req, res) => {

  try {

    const response = await sqs.send(
      new ReceiveMessageCommand({
        QueueUrl: process.env.SQS_QUEUE_URL,
        MaxNumberOfMessages: 10,
        WaitTimeSeconds: 5
      })
    );

    if (!response.Messages || response.Messages.length === 0) {
      return res.json({
        message: "No messages in queue"
      });
    }

    for (const msg of response.Messages) {

      const payment = JSON.parse(msg.Body);

      await dynamoDB.send(
        new PutCommand({
          TableName: TABLE_NAME,
          Item: {
            notificationId: randomUUID(),
            userId: payment.orderId || "USER-1001",
            title: "Payment Successful",
            message: `Your payment for Order ${payment.orderId} was completed successfully.`,
            type: "payment",
            isRead: false,
            createdAt: new Date().toISOString()
          }
        })
      );

      await sqs.send(
        new DeleteMessageCommand({
          QueueUrl: process.env.SQS_QUEUE_URL,
          ReceiptHandle: msg.ReceiptHandle
        })
      );
    }

    res.json({
      message: "Notifications processed successfully"
    });

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }

};
// ------------------------------------
// GET Notification By ID
// ------------------------------------
const getNotificationById = async (req, res) => {

  try {

    const result = await dynamoDB.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          notificationId: req.params.id
        }
      })
    );

    if (!result.Item) {
      return res.status(404).json({
        message: "Notification not found"
      });
    }

    res.json(result.Item);

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }

};

// ------------------------------------
// UPDATE Notification
// ---------------------------------

// ========================================
// PART 2
// updateNotification
// deleteNotification
// markAsRead
// markAllAsRead
// getNotificationsByUser
// getUnreadCount
// ========================================

// UPDATE Notification
const updateNotification = async (req, res) => {
  try {

    const notificationId = req.params.id;

    const existing = await dynamoDB.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { notificationId }
      })
    );

    if (!existing.Item) {
      return res.status(404).json({
        message: "Notification not found"
      });
    }

    const updates = req.body;

    let updateExpression = "SET ";
    const ExpressionAttributeNames = {};
    const ExpressionAttributeValues = {};

    Object.keys(updates).forEach((key, index) => {

      updateExpression += `#${key}= :${key}`;

      if (index !== Object.keys(updates).length - 1) {
        updateExpression += ", ";
      }

      ExpressionAttributeNames[`#${key}`] = key;
      ExpressionAttributeValues[`:${key}`] = updates[key];

    });

    const result = await dynamoDB.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { notificationId },
        UpdateExpression: updateExpression,
        ExpressionAttributeNames,
        ExpressionAttributeValues,
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

// DELETE Notification
const deleteNotification = async (req, res) => {

  try {

    const notificationId = req.params.id;

    const existing = await dynamoDB.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { notificationId }
      })
    );

    if (!existing.Item) {
      return res.status(404).json({
        message: "Notification not found"
      });
    }

    await dynamoDB.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { notificationId }
      })
    );

    res.json({
      message: "Notification deleted successfully"
    });

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }

};

// MARK AS READ
const markAsRead = async (req, res) => {

  try {

    const notificationId = req.params.id;

    const existing = await dynamoDB.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { notificationId }
      })
    );

    if (!existing.Item) {
      return res.status(404).json({
        message: "Notification not found"
      });
    }

    const result = await dynamoDB.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { notificationId },
        UpdateExpression: "SET isRead = :r",
        ExpressionAttributeValues: {
          ":r": true
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

// MARK ALL AS READ
const markAllAsRead = async (req, res) => {

  try {

    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        message: "userId is required"
      });
    }

    const data = await dynamoDB.send(
      new ScanCommand({
        TableName: TABLE_NAME
      })
    );

    const notifications = data.Items.filter(
      item => item.userId === userId && item.isRead === false
    );

    for (const item of notifications) {

      await dynamoDB.send(
        new UpdateCommand({
          TableName: TABLE_NAME,
          Key: {
            notificationId: item.notificationId
          },
          UpdateExpression: "SET isRead = :r",
          ExpressionAttributeValues: {
            ":r": true
          }
        })
      );

    }

    res.json({
      message: "All notifications marked as read"
    });

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }

};

// GET Notifications By User
const getNotificationsByUser = async (req, res) => {

  try {

    const data = await dynamoDB.send(
      new ScanCommand({
        TableName: TABLE_NAME
      })
    );

    const notifications = data.Items.filter(
      item => item.userId === req.params.userId
    );

    notifications.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    res.json(notifications);

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }

};

// GET UNREAD COUNT
const getUnreadCount = async (req, res) => {

  try {

    const data = await dynamoDB.send(
      new ScanCommand({
        TableName: TABLE_NAME
      })
    );

    const unreadCount = data.Items.filter(
      item =>
        item.userId === req.params.userId &&
        item.isRead === false
    ).length;

    res.json({
      userId: req.params.userId,
      unreadCount
    });

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }

};

module.exports = {
  createNotification,
  getAllNotifications,
  getNotificationById,
  updateNotification,
  deleteNotification,
  markAsRead,
  markAllAsRead,
  getNotificationsByUser,
  getUnreadCount,
  receiveNotifications
};