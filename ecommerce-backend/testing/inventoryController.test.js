// Inventory Service - Controller Unit Tests
const {
  createInventory,
  getAllInventory,
  getInventoryById,
  getInventoryByProductId,
  updateInventory,
  deleteInventory,
  adjustStock,
  getLowStockItems,
  getMovementHistory
} = require("../inventory-service/src/controllers/inventoryController");

// Mock DynamoDB
jest.mock("../inventory-service/src/config/db", () => ({
  send: jest.fn()
}));

const dynamoDB = require("../inventory-service/src/config/db");

// Set env
process.env.INVENTORY_TABLE = "test-inventory";

const mockReq = (body = {}, params = {}, query = {}) => ({ body, params, query });
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("Inventory Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ===== CREATE INVENTORY =====
  describe("createInventory", () => {
    it("should return 400 if required fields missing", async () => {
      const req = mockReq({ currentStock: 10 });
      const res = mockRes();
      await createInventory(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining("productId, productName are required")
      }));
    });

    it("should return 400 for invalid stock values", async () => {
      const req = mockReq({ productId: "p1", productName: "Phone", currentStock: -5 });
      const res = mockRes();
      await createInventory(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should create inventory successfully", async () => {
      dynamoDB.send.mockResolvedValueOnce({});
      
      const req = mockReq({ productId: "p1", productName: "Phone", currentStock: 10, reservedStock: 2 });
      const res = mockRes();
      await createInventory(req, res);
      
      expect(res.status).toHaveBeenCalledWith(201);
      const inventory = res.json.mock.calls[0][0];
      expect(inventory.productId).toBe("p1");
      expect(inventory.availableStock).toBe(8); // 10 - 2
      expect(inventory.movements).toHaveLength(1);
    });

    it("should return 409 if inventory already exists", async () => {
      const error = new Error("Already exists");
      error.name = "ConditionalCheckFailedException";
      dynamoDB.send.mockRejectedValueOnce(error);

      const req = mockReq({ productId: "p1", productName: "Phone" });
      const res = mockRes();
      await createInventory(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
    });
  });

  // ===== GET ALL INVENTORY =====
  describe("getAllInventory", () => {
    it("should return all inventory items", async () => {
      dynamoDB.send.mockResolvedValueOnce({
        Items: [
          { productId: "p1", availableStock: 5, lowStockThreshold: 10, updatedAt: "2026-01-02" },
          { productId: "p2", availableStock: 20, lowStockThreshold: 10, updatedAt: "2026-01-01" }
        ]
      });

      const req = mockReq();
      const res = mockRes();
      await getAllInventory(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const items = res.json.mock.calls[0][0];
      expect(items).toHaveLength(2);
      expect(items[0].productId).toBe("p1"); // sorted by date
    });

    it("should filter low stock items when query param is present", async () => {
      dynamoDB.send.mockResolvedValueOnce({
        Items: [
          { productId: "p1", availableStock: 5, lowStockThreshold: 10, updatedAt: "2026-01-02" },
          { productId: "p2", availableStock: 20, lowStockThreshold: 10, updatedAt: "2026-01-01" }
        ]
      });

      const req = mockReq({}, {}, { lowStock: "true" });
      const res = mockRes();
      await getAllInventory(req, res);

      const items = res.json.mock.calls[0][0];
      expect(items).toHaveLength(1);
      expect(items[0].productId).toBe("p1");
    });
  });

  // ===== ADJUST STOCK =====
  describe("adjustStock", () => {
    it("should return 400 if type or quantity is missing", async () => {
      const req = mockReq({ quantity: 5 }, { productId: "p1" });
      const res = mockRes();
      await adjustStock(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 404 if item not found", async () => {
      dynamoDB.send.mockResolvedValueOnce({ Item: null });
      const req = mockReq({ type: "addition", quantity: 5 }, { productId: "nonexistent" });
      const res = mockRes();
      await adjustStock(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should handle 'addition' adjustment", async () => {
      dynamoDB.send
        .mockResolvedValueOnce({
          Item: { productId: "p1", currentStock: 10, reservedStock: 0, movements: [] }
        })
        .mockResolvedValueOnce({
          Attributes: { productId: "p1", currentStock: 15, availableStock: 15 }
        });

      const req = mockReq({ type: "addition", quantity: 5 }, { productId: "p1" });
      const res = mockRes();
      await adjustStock(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ currentStock: 15 }));
    });

    it("should handle 'removal' adjustment", async () => {
      dynamoDB.send
        .mockResolvedValueOnce({
          Item: { productId: "p1", currentStock: 10, reservedStock: 0, movements: [] }
        })
        .mockResolvedValueOnce({
          Attributes: { productId: "p1", currentStock: 5, availableStock: 5 }
        });

      const req = mockReq({ type: "removal", quantity: 5 }, { productId: "p1" });
      const res = mockRes();
      await adjustStock(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ currentStock: 5 }));
    });

    it("should reject removal if insufficient stock", async () => {
      dynamoDB.send.mockResolvedValueOnce({
        Item: { productId: "p1", currentStock: 5, reservedStock: 0 }
      });

      const req = mockReq({ type: "removal", quantity: 10 }, { productId: "p1" });
      const res = mockRes();
      await adjustStock(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Insufficient available stock" });
    });
  });

  // ===== GET LOW STOCK =====
  describe("getLowStockItems", () => {
    it("should return items below threshold", async () => {
      dynamoDB.send.mockResolvedValueOnce({
        Items: [
          { productId: "p1", availableStock: 5, lowStockThreshold: 10 },
          { productId: "p2", availableStock: 20, lowStockThreshold: 10 }
        ]
      });

      const req = mockReq();
      const res = mockRes();
      await getLowStockItems(req, res);

      const items = res.json.mock.calls[0][0];
      expect(items).toHaveLength(1);
      expect(items[0].productId).toBe("p1");
    });
  });
});
