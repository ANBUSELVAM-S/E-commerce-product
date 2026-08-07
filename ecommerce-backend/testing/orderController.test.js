// Order Service - Controller Unit Tests
// Set env variables before importing controller
process.env.ORDER_TABLE = "test-orders";
process.env.CART_SERVICE_URL = "http://localhost:5002";
process.env.PRODUCT_SERVICE_URL = "http://localhost:5001";
process.env.INVENTORY_SERVICE_URL = "http://localhost:5007";
process.env.PAYMENT_SERVICE_URL = "http://localhost:5005";

const {
  createOrder,
  getOrders,
  getOrderById,
  deleteOrder,
  cancelOrder,
  payOrder
} = require("../order-service/src/controllers/orderController");

// Mock DynamoDB
jest.mock("../order-service/src/config/db", () => ({
  send: jest.fn()
}));

// Mock axios
jest.mock("axios", () => ({
  get: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn()
}));

const dynamoDB = require("../order-service/src/config/db");
const axios = require("axios");

const mockReq = (body = {}, params = {}, query = {}, headers = {}) => ({ body, params, query, headers });
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("Order Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ===== CREATE ORDER =====
  describe("createOrder", () => {
    it("should return 400 if cartId or shippingAddress is missing", async () => {
      const req = mockReq({ userId: "u1" });
      const res = mockRes();
      await createOrder(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "cartId and shippingAddress are required"
      });
    });

    it("should return 404 if cart is not found", async () => {
      const error = new Error("Not found");
      error.response = { status: 404 };
      axios.get.mockRejectedValueOnce(error);

      const req = mockReq({ cartId: "c1", shippingAddress: {}, userId: "u1" });
      const res = mockRes();
      await createOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Cart not found" });
    });

    it("should return 400 if cart is empty", async () => {
      axios.get.mockResolvedValueOnce({
        data: { items: [], subtotal: 0 }
      });

      const req = mockReq({ cartId: "c1", shippingAddress: {}, userId: "u1" });
      const res = mockRes();
      await createOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Cart is empty" });
    });

    it("should create order and update inventory successfully", async () => {
      // Mock cart fetch
      axios.get.mockResolvedValueOnce({
        data: {
          items: [{ productId: "p1", quantity: 2, price: 100 }],
          subtotal: 200
        }
      });

      // Mock DB put
      dynamoDB.send.mockResolvedValueOnce({});
      
      // Mock inventory patch
      axios.patch.mockResolvedValueOnce({});
      
      // Mock cart delete
      axios.delete.mockResolvedValueOnce({});

      const req = mockReq({ cartId: "c1", shippingAddress: { street: "123 Main" }, userId: "u1" });
      const res = mockRes();
      await createOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      const createdOrder = res.json.mock.calls[0][0];
      expect(createdOrder).toHaveProperty("orderId");
      expect(createdOrder.totalAmount).toBe(250); // 200 subtotal + 50 shipping
      expect(createdOrder.status).toBe("pending");
      
      expect(axios.patch).toHaveBeenCalledWith(
        expect.stringContaining("/api/inventory/p1/adjust"),
        expect.objectContaining({ type: "removal", quantity: 2 }),
        expect.objectContaining({ headers: expect.any(Object) })
      );
      
      expect(axios.delete).toHaveBeenCalledWith(
        expect.stringContaining("/api/cart/c1/clear"),
        expect.objectContaining({ headers: expect.any(Object) })
      );
    });
  });

  // ===== GET ORDERS =====
  describe("getOrders", () => {
    it("should return all orders", async () => {
      dynamoDB.send.mockResolvedValueOnce({
        Items: [
          { orderId: "o1", userId: "u1", status: "pending", createdAt: "2026-01-01" },
          { orderId: "o2", userId: "u2", status: "confirmed", createdAt: "2026-01-02" }
        ]
      });

      const req = mockReq();
      const res = mockRes();
      await getOrders(req, res);

      expect(res.json).toHaveBeenCalled();
      const orders = res.json.mock.calls[0][0];
      expect(orders).toHaveLength(2);
      expect(orders[0].orderId).toBe("o2"); // sorted by date desc
    });

    it("should filter by userId and status", async () => {
      dynamoDB.send.mockResolvedValueOnce({
        Items: [
          { orderId: "o1", userId: "u1", status: "pending", createdAt: "2026-01-01" },
          { orderId: "o2", userId: "u2", status: "confirmed", createdAt: "2026-01-02" },
          { orderId: "o3", userId: "u1", status: "confirmed", createdAt: "2026-01-03" }
        ]
      });

      const req = mockReq({}, {}, { userId: "u1", status: "confirmed" });
      const res = mockRes();
      await getOrders(req, res);

      const orders = res.json.mock.calls[0][0];
      expect(orders).toHaveLength(1);
      expect(orders[0].orderId).toBe("o3");
    });
  });

  // ===== GET ORDER BY ID =====
  describe("getOrderById", () => {
    it("should return order when found", async () => {
      dynamoDB.send.mockResolvedValueOnce({
        Item: { orderId: "o1", status: "pending" }
      });

      const req = mockReq({}, { id: "o1" });
      const res = mockRes();
      await getOrderById(req, res);

      expect(res.json).toHaveBeenCalledWith({ orderId: "o1", status: "pending" });
    });

    it("should return 404 when order not found", async () => {
      dynamoDB.send.mockResolvedValueOnce({ Item: null });

      const req = mockReq({}, { id: "nonexistent" });
      const res = mockRes();
      await getOrderById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  // ===== DELETE ORDER =====
  describe("deleteOrder", () => {
    it("should delete order successfully", async () => {
      dynamoDB.send
        .mockResolvedValueOnce({ Item: { orderId: "o1" } })
        .mockResolvedValueOnce({});

      const req = mockReq({}, { id: "o1" });
      const res = mockRes();
      await deleteOrder(req, res);

      expect(res.json).toHaveBeenCalledWith({
        message: "Order deleted successfully"
      });
    });
  });

  // ===== CANCEL ORDER =====
  describe("cancelOrder", () => {
    it("should cancel a pending order", async () => {
      dynamoDB.send
        .mockResolvedValueOnce({ Item: { orderId: "o1", status: "pending" } })
        .mockResolvedValueOnce({ Attributes: { orderId: "o1", status: "cancelled" } });

      const req = mockReq({}, { id: "o1" });
      const res = mockRes();
      await cancelOrder(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        status: "cancelled"
      }));
    });

    it("should return 400 if order is not pending", async () => {
      dynamoDB.send.mockResolvedValueOnce({ Item: { orderId: "o1", status: "confirmed" } });

      const req = mockReq({}, { id: "o1" });
      const res = mockRes();
      await cancelOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining("Cannot cancel")
      }));
    });
  });

  // ===== PAY ORDER =====
  describe("payOrder", () => {
    it("should update order to paid and confirmed", async () => {
      dynamoDB.send
        .mockResolvedValueOnce({ Item: { orderId: "o1", status: "pending", paymentStatus: "unpaid" } })
        .mockResolvedValueOnce({ Attributes: { orderId: "o1", status: "confirmed", paymentStatus: "paid" } });

      const req = mockReq({}, { orderId: "o1" });
      const res = mockRes();
      await payOrder(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        status: "confirmed",
        paymentStatus: "paid"
      }));
    });
    
    it("should return 404 if order not found", async () => {
      dynamoDB.send.mockResolvedValueOnce({ Item: null });

      const req = mockReq({}, { orderId: "nonexistent" });
      const res = mockRes();
      await payOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});
