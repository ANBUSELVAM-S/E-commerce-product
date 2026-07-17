// Notification Service - Controller Unit Tests
const {
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
} = require("../notification-service/src/controllers/notificationController");

// Mock DynamoDB
jest.mock("../notification-service/src/config/db", () => ({
  send: jest.fn()
}));

// Mock SQS
jest.mock("../notification-service/src/config/sqs", () => ({
  send: jest.fn()
}));

const dynamoDB = require("../notification-service/src/config/db");
const sqs = require("../notification-service/src/config/sqs");

// Set env
process.env.NOTIFICATION_TABLE = "test-notifications";
process.env.SQS_QUEUE_URL = "https://sqs.mock.url";

const mockReq = (body = {}, params = {}, query = {}) => ({ body, params, query });
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("Notification Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ===== CREATE NOTIFICATION =====
  describe("createNotification", () => {
    it("should create notification successfully", async () => {
      dynamoDB.send.mockResolvedValueOnce({});

      const req = mockReq({ userId: "u1", title: "Test", message: "Msg", type: "info" });
      const res = mockRes();
      await createNotification(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      const notification = res.json.mock.calls[0][0];
      expect(notification).toHaveProperty("notificationId");
      expect(notification.isRead).toBe(false);
    });
  });

  // ===== GET ALL NOTIFICATIONS =====
  describe("getAllNotifications", () => {
    it("should return and filter notifications", async () => {
      dynamoDB.send.mockResolvedValueOnce({
        Items: [
          { notificationId: "n1", userId: "u1", type: "info", isRead: false, createdAt: "2026-01-02" },
          { notificationId: "n2", userId: "u2", type: "alert", isRead: true, createdAt: "2026-01-01" },
          { notificationId: "n3", userId: "u1", type: "info", isRead: true, createdAt: "2026-01-03" }
        ]
      });

      const req = mockReq({}, {}, { userId: "u1", type: "info", isRead: "false" });
      const res = mockRes();
      await getAllNotifications(req, res);

      const items = res.json.mock.calls[0][0];
      expect(items).toHaveLength(1);
      expect(items[0].notificationId).toBe("n1");
    });
  });

  // ===== RECEIVE NOTIFICATIONS (SQS) =====
  describe("receiveNotifications", () => {
    it("should process SQS messages and create notifications", async () => {
      sqs.send
        .mockResolvedValueOnce({
          Messages: [
            { Body: JSON.stringify({ orderId: "o1" }), ReceiptHandle: "handle1" }
          ]
        })
        .mockResolvedValueOnce({}); // DeleteMessageCommand

      dynamoDB.send.mockResolvedValueOnce({}); // PutCommand

      const req = mockReq();
      const res = mockRes();
      await receiveNotifications(req, res);

      expect(res.json).toHaveBeenCalledWith({ message: "Notifications processed successfully" });
      expect(sqs.send).toHaveBeenCalledTimes(2);
      expect(dynamoDB.send).toHaveBeenCalledTimes(1);
    });

    it("should handle empty queue", async () => {
      sqs.send.mockResolvedValueOnce({ Messages: [] });

      const req = mockReq();
      const res = mockRes();
      await receiveNotifications(req, res);

      expect(res.json).toHaveBeenCalledWith({ message: "No messages in queue" });
      expect(dynamoDB.send).not.toHaveBeenCalled();
    });
  });

  // ===== MARK AS READ =====
  describe("markAsRead", () => {
    it("should mark a specific notification as read", async () => {
      dynamoDB.send
        .mockResolvedValueOnce({ Item: { notificationId: "n1", isRead: false } })
        .mockResolvedValueOnce({ Attributes: { notificationId: "n1", isRead: true } });

      const req = mockReq({}, { id: "n1" });
      const res = mockRes();
      await markAsRead(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ isRead: true }));
    });

    it("should return 404 if not found", async () => {
      dynamoDB.send.mockResolvedValueOnce({ Item: null });

      const req = mockReq({}, { id: "nonexistent" });
      const res = mockRes();
      await markAsRead(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  // ===== MARK ALL AS READ =====
  describe("markAllAsRead", () => {
    it("should mark all user notifications as read", async () => {
      dynamoDB.send
        .mockResolvedValueOnce({
          Items: [
            { notificationId: "n1", userId: "u1", isRead: false },
            { notificationId: "n2", userId: "u1", isRead: false },
            { notificationId: "n3", userId: "u2", isRead: false }
          ]
        })
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({});

      const req = mockReq({ userId: "u1" });
      const res = mockRes();
      await markAllAsRead(req, res);

      expect(res.json).toHaveBeenCalledWith({ message: "All notifications marked as read" });
      // Scan + 2 updates
      expect(dynamoDB.send).toHaveBeenCalledTimes(3); 
    });

    it("should return 400 if userId is missing", async () => {
      const req = mockReq({});
      const res = mockRes();
      await markAllAsRead(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // ===== GET UNREAD COUNT =====
  describe("getUnreadCount", () => {
    it("should return correct unread count for user", async () => {
      dynamoDB.send.mockResolvedValueOnce({
        Items: [
          { notificationId: "n1", userId: "u1", isRead: false },
          { notificationId: "n2", userId: "u1", isRead: true },
          { notificationId: "n3", userId: "u1", isRead: false }
        ]
      });

      const req = mockReq({}, { userId: "u1" });
      const res = mockRes();
      await getUnreadCount(req, res);

      expect(res.json).toHaveBeenCalledWith({
        userId: "u1",
        unreadCount: 2
      });
    });
  });
});
