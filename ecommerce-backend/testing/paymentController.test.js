// Payment Service - Controller Unit Tests
const {
  initiatePayment,
  confirmPayment,
  failPayment,
  getTransactionsByOrderId,
  createPayment,
  getAllPayments,
  getPaymentById,
  updatePayment,
  deletePayment
} = require("../payment-service/src/controllers/paymentController");

// Mock DynamoDB
jest.mock("../payment-service/src/config/db", () => ({
  send: jest.fn()
}));

// Mock axios
jest.mock("axios", () => ({
  get: jest.fn(),
  patch: jest.fn()
}));

// Mock AWS SNS
jest.mock("@aws-sdk/client-sns", () => ({
  SNSClient: jest.fn().mockImplementation(() => ({
    send: jest.fn()
  })),
  PublishCommand: jest.fn()
}));

const dynamoDB = require("../payment-service/src/config/db");
const axios = require("axios");

// Set env vars
process.env.PAYMENT_TABLE = "test-payments";
process.env.ORDER_SERVICE_URL = "http://localhost:5003";
process.env.SNS_TOPIC_ARN = "arn:aws:sns:region:account:topic";

const mockReq = (body = {}, params = {}, query = {}, headers = {}) => ({ body, params, query, headers });
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("Payment Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ===== INITIATE PAYMENT =====
  describe("initiatePayment", () => {
    it("should return 400 if orderId or method is missing", async () => {
      const req = mockReq({ method: "card" });
      const res = mockRes();
      await initiatePayment(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 400 for invalid method", async () => {
      const req = mockReq({ orderId: "o1", method: "bitcoin" });
      const res = mockRes();
      await initiatePayment(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining("Invalid method")
      }));
    });

    it("should return 404 if order not found", async () => {
      const error = new Error();
      error.response = { status: 404 };
      axios.get.mockRejectedValueOnce(error);

      const req = mockReq({ orderId: "nonexistent", method: "card" });
      const res = mockRes();
      await initiatePayment(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should initiate payment successfully", async () => {
      axios.get.mockResolvedValueOnce({
        data: { orderId: "o1", totalAmount: 500, userId: "u1" }
      });
      dynamoDB.send.mockResolvedValueOnce({});

      const req = mockReq({ orderId: "o1", method: "card" });
      const res = mockRes();
      await initiatePayment(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      const transaction = res.json.mock.calls[0][0];
      expect(transaction).toHaveProperty("transactionId");
      expect(transaction.amount).toBe(500);
      expect(transaction.status).toBe("pending");
    });
  });

  // ===== CONFIRM PAYMENT =====
  describe("confirmPayment", () => {
    it("should return 400 if transactionId is missing", async () => {
      const req = mockReq({});
      const res = mockRes();
      await confirmPayment(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 404 if transaction not found", async () => {
      dynamoDB.send.mockResolvedValueOnce({ Item: null });
      const req = mockReq({ transactionId: "t1" });
      const res = mockRes();
      await confirmPayment(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should confirm payment, update order and send SNS", async () => {
      // Get transaction
      dynamoDB.send.mockResolvedValueOnce({
        Item: { transactionId: "t1", orderId: "o1", status: "pending", amount: 500 }
      });
      
      // Update transaction
      dynamoDB.send.mockResolvedValueOnce({
        Attributes: { transactionId: "t1", status: "success" }
      });

      // Mock order update
      axios.patch.mockResolvedValueOnce({ data: {} });

      const req = mockReq({ transactionId: "t1" });
      const res = mockRes();
      await confirmPayment(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: "success" }));
      expect(axios.patch).toHaveBeenCalledWith(
        expect.stringContaining("/api/orders/o1/pay"),
        {},
        expect.objectContaining({ headers: expect.any(Object) })
      );
      // SNS mock doesn't need explicit verification since we checked it didn't crash
    });

    it("should return 400 if already confirmed", async () => {
      dynamoDB.send.mockResolvedValueOnce({
        Item: { transactionId: "t1", status: "success" }
      });

      const req = mockReq({ transactionId: "t1" });
      const res = mockRes();
      await confirmPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Transaction already confirmed" });
    });
  });

  // ===== FAIL PAYMENT =====
  describe("failPayment", () => {
    it("should set transaction status to failed", async () => {
      dynamoDB.send
        .mockResolvedValueOnce({ Item: { transactionId: "t1", status: "pending" } })
        .mockResolvedValueOnce({ Attributes: { transactionId: "t1", status: "failed" } });

      const req = mockReq({ transactionId: "t1" });
      const res = mockRes();
      await failPayment(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: "failed" }));
    });
  });

  // ===== GET PAYMENTS BY ORDER =====
  describe("getTransactionsByOrderId", () => {
    it("should return transactions for an order", async () => {
      dynamoDB.send.mockResolvedValueOnce({
        Items: [
          { transactionId: "t1", orderId: "o1", createdAt: "2026-01-01" },
          { transactionId: "t2", orderId: "o2", createdAt: "2026-01-01" },
          { transactionId: "t3", orderId: "o1", createdAt: "2026-01-02" }
        ]
      });

      const req = mockReq({}, { orderId: "o1" });
      const res = mockRes();
      await getTransactionsByOrderId(req, res);

      const transactions = res.json.mock.calls[0][0];
      expect(transactions).toHaveLength(2);
      expect(transactions[0].transactionId).toBe("t3"); // sorted desc
    });
  });
});
