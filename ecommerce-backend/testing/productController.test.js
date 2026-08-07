// Product Service - Controller Unit Tests
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  updateStock
} = require("../product-service/src/controllers/productController");

// Mock DynamoDB
jest.mock("../product-service/src/config/db", () => ({
  send: jest.fn()
}));

// Mock axios
jest.mock("axios", () => ({
  post: jest.fn(),
  get: jest.fn(),
  delete: jest.fn()
}));

const db = require("../product-service/src/config/db");
const axios = require("axios");

// Set env
process.env.PRODUCT_TABLE = "test-products";
process.env.INVENTORY_SERVICE_URL = "http://localhost:5007";

const mockReq = (body = {}, params = {}, query = {}, headers = {}) => ({ body, params, query, headers });
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("Product Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ===== GET ALL PRODUCTS =====
  describe("getProducts", () => {
    it("should return all products", async () => {
      db.send.mockResolvedValueOnce({
        Items: [{ productId: "1", name: "Phone" }]
      });

      const req = mockReq();
      const res = mockRes();
      await getProducts(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        products: [{ productId: "1", name: "Phone" }]
      }));
    });

    it("should return 500 on error", async () => {
      db.send.mockRejectedValueOnce(new Error("DB error"));
      const req = mockReq();
      const res = mockRes();
      await getProducts(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ===== GET PRODUCT BY ID =====
  describe("getProductById", () => {
    it("should return product when found", async () => {
      db.send.mockResolvedValueOnce({
        Item: { productId: "1", name: "Phone" }
      });

      const req = mockReq({}, { id: "1" });
      const res = mockRes();
      await getProductById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ productId: "1", name: "Phone" });
    });

    it("should return 404 when product not found", async () => {
      db.send.mockResolvedValueOnce({ Item: null });

      const req = mockReq({}, { id: "nonexistent" });
      const res = mockRes();
      await getProductById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Product not found" });
    });
  });

  // ===== CREATE PRODUCT =====
  describe("createProduct", () => {
    it("should return 400 if name is missing", async () => {
      const req = mockReq({ price: 100 });
      const res = mockRes();
      await createProduct(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Product name is required" });
    });

    it("should return 400 if price is missing", async () => {
      const req = mockReq({ name: "Phone" });
      const res = mockRes();
      await createProduct(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Product price is required" });
    });

    it("should return 400 if price is negative", async () => {
      const req = mockReq({ name: "Phone", price: -10 });
      const res = mockRes();
      await createProduct(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should create product and inventory successfully", async () => {
      db.send.mockResolvedValueOnce({}); // PutCommand for product
      axios.post.mockResolvedValueOnce({
        data: { inventoryId: "inv-1" }
      });

      const req = mockReq({
        name: "Phone", price: 500, category: "Electronics", stock: 10
      });
      const res = mockRes();
      await createProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: "Product and inventory created successfully"
      }));
    });

    it("should rollback product if inventory creation fails", async () => {
      db.send
        .mockResolvedValueOnce({}) // PutCommand product
        .mockResolvedValueOnce({}); // DeleteCommand rollback

      axios.post.mockRejectedValueOnce(new Error("Inventory down"));

      const req = mockReq({
        name: "Phone", price: 500, category: "Electronics", stock: 10
      });
      const res = mockRes();
      await createProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(502);
    });
  });

  // ===== UPDATE PRODUCT =====
  describe("updateProduct", () => {
    it("should return 400 if required fields are missing", async () => {
      const req = mockReq({ name: "Phone" }, { id: "1" });
      const res = mockRes();
      await updateProduct(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should update product successfully", async () => {
      db.send.mockResolvedValueOnce({
        Attributes: { productId: "1", name: "Updated Phone" }
      });

      const req = mockReq(
        { name: "Updated Phone", price: 600, stock: 15, description: "", category: "", imageUrl: "" },
        { id: "1" }
      );
      const res = mockRes();
      await updateProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return 404 if product not found on update", async () => {
      const error = new Error("Not found");
      error.name = "ConditionalCheckFailedException";
      db.send.mockRejectedValueOnce(error);

      const req = mockReq(
        { name: "Phone", price: 500, stock: 10 },
        { id: "nonexistent" }
      );
      const res = mockRes();
      await updateProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  // ===== DELETE PRODUCT =====
  describe("deleteProduct", () => {
    it("should delete product successfully", async () => {
      db.send.mockResolvedValueOnce({
        Attributes: { productId: "1" }
      });

      const req = mockReq({}, { id: "1" });
      const res = mockRes();
      await deleteProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: "Product and inventory removed successfully"
      }));
    });

    it("should return 404 if product not found", async () => {
      const error = new Error("Not found");
      error.name = "ConditionalCheckFailedException";
      db.send.mockRejectedValueOnce(error);

      const req = mockReq({}, { id: "nonexistent" });
      const res = mockRes();
      await deleteProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  // ===== UPDATE STOCK =====
  describe("updateStock", () => {
    it("should return 400 if stock is missing or invalid", async () => {
      const req = mockReq({ stock: -5 }, { id: "1" });
      const res = mockRes();
      await updateStock(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should update stock successfully", async () => {
      db.send.mockResolvedValueOnce({
        Attributes: { productId: "1", stock: 20 }
      });

      const req = mockReq({ stock: 20 }, { id: "1" });
      const res = mockRes();
      await updateStock(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});
