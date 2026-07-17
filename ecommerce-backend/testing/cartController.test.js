// Cart Service - Controller Unit Tests
const {
  createCart,
  getAllCarts,
  getCart,
  addItem,
  updateItemQuantity,
  removeItem,
  clearCart,
  deleteCart,
  getCartSummary
} = require("../cart-service/src/controllers/cartController");

// Mock DynamoDB
jest.mock("../cart-service/src/config/db", () => ({
  send: jest.fn()
}));

// Mock axios
jest.mock("axios", () => ({
  get: jest.fn()
}));

const dynamoDB = require("../cart-service/src/config/db");
const axios = require("axios");

// Set env
process.env.CART_TABLE = "test-carts";
process.env.PRODUCT_SERVICE_URL = "http://localhost:5001";

const mockReq = (body = {}, params = {}, query = {}) => ({ body, params, query });
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("Cart Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ===== CREATE CART =====
  describe("createCart", () => {
    it("should create a cart with a product", async () => {
      axios.get.mockResolvedValueOnce({
        data: { productId: "p1", name: "Phone", price: 500, imageUrl: "img.jpg" }
      });
      dynamoDB.send.mockResolvedValueOnce({});

      const req = mockReq({ productId: "p1", quantity: 2 }, {});
      const res = mockRes();
      await createCart(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        items: expect.arrayContaining([
          expect.objectContaining({ productId: "p1", quantity: 2 })
        ])
      }));
    });

    it("should return 500 if product service fails", async () => {
      axios.get.mockRejectedValueOnce(new Error("Product not found"));

      const req = mockReq({ productId: "p1" }, {});
      const res = mockRes();
      await createCart(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ===== GET ALL CARTS =====
  describe("getAllCarts", () => {
    it("should return all carts", async () => {
      dynamoDB.send.mockResolvedValueOnce({
        Items: [{ cartId: "c1" }, { cartId: "c2" }]
      });

      const req = mockReq();
      const res = mockRes();
      await getAllCarts(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([{ cartId: "c1" }, { cartId: "c2" }]);
    });
  });

  // ===== GET CART =====
  describe("getCart", () => {
    it("should return cart when found", async () => {
      dynamoDB.send.mockResolvedValueOnce({
        Item: {
          cartId: "c1",
          items: [{ productId: "p1", name: "Phone", price: 500, quantity: 2 }],
          createdAt: "2026-01-01",
          updatedAt: "2026-01-01"
        }
      });

      const req = mockReq({}, { cartId: "c1" });
      const res = mockRes();
      await getCart(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        cartId: "c1",
        subtotal: 1000
      }));
    });

    it("should return 404 when cart not found", async () => {
      dynamoDB.send.mockResolvedValueOnce({ Item: null });

      const req = mockReq({}, { cartId: "nonexistent" });
      const res = mockRes();
      await getCart(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  // ===== ADD ITEM =====
  describe("addItem", () => {
    it("should add a new item to existing cart", async () => {
      axios.get.mockResolvedValueOnce({
        data: { productId: "p2", name: "Laptop", price: 1000, imageUrl: "img2.jpg" }
      });
      dynamoDB.send
        .mockResolvedValueOnce({
          Item: {
            cartId: "c1",
            items: [{ productId: "p1", name: "Phone", price: 500, quantity: 1 }],
            createdAt: "2026-01-01"
          }
        })
        .mockResolvedValueOnce({});

      const req = mockReq({ productId: "p2", quantity: 1 }, { cartId: "c1" });
      const res = mockRes();
      await addItem(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        items: expect.arrayContaining([
          expect.objectContaining({ productId: "p2" })
        ])
      }));
    });

    it("should increase quantity if product already exists", async () => {
      axios.get.mockResolvedValueOnce({
        data: { productId: "p1", name: "Phone", price: 500, imageUrl: "img.jpg" }
      });
      dynamoDB.send
        .mockResolvedValueOnce({
          Item: {
            cartId: "c1",
            items: [{ productId: "p1", name: "Phone", price: 500, quantity: 1 }],
            createdAt: "2026-01-01"
          }
        })
        .mockResolvedValueOnce({});

      const req = mockReq({ productId: "p1", quantity: 2 }, { cartId: "c1" });
      const res = mockRes();
      await addItem(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const items = res.json.mock.calls[0][0].items;
      expect(items[0].quantity).toBe(3);
    });
  });

  // ===== UPDATE ITEM QUANTITY =====
  describe("updateItemQuantity", () => {
    it("should update item quantity", async () => {
      dynamoDB.send
        .mockResolvedValueOnce({
          Item: {
            cartId: "c1",
            items: [{ productId: "p1", name: "Phone", price: 500, quantity: 1 }]
          }
        })
        .mockResolvedValueOnce({});

      const req = mockReq({ productId: "p1", quantity: 5 }, { cartId: "c1" });
      const res = mockRes();
      await updateItemQuantity(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return 404 if cart not found", async () => {
      dynamoDB.send.mockResolvedValueOnce({ Item: null });

      const req = mockReq({ productId: "p1", quantity: 5 }, { cartId: "nonexistent" });
      const res = mockRes();
      await updateItemQuantity(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should return 404 if item not found in cart", async () => {
      dynamoDB.send.mockResolvedValueOnce({
        Item: { cartId: "c1", items: [{ productId: "p2", quantity: 1 }] }
      });

      const req = mockReq({ productId: "p1", quantity: 5 }, { cartId: "c1" });
      const res = mockRes();
      await updateItemQuantity(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  // ===== REMOVE ITEM =====
  describe("removeItem", () => {
    it("should remove an item from cart", async () => {
      dynamoDB.send
        .mockResolvedValueOnce({
          Item: {
            cartId: "c1",
            items: [
              { productId: "p1", quantity: 1 },
              { productId: "p2", quantity: 2 }
            ]
          }
        })
        .mockResolvedValueOnce({});

      const req = mockReq({}, { cartId: "c1", productId: "p1" });
      const res = mockRes();
      await removeItem(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const items = res.json.mock.calls[0][0].items;
      expect(items).toHaveLength(1);
      expect(items[0].productId).toBe("p2");
    });
  });

  // ===== CLEAR CART =====
  describe("clearCart", () => {
    it("should clear all items from cart", async () => {
      dynamoDB.send
        .mockResolvedValueOnce({
          Item: { cartId: "c1", items: [{ productId: "p1" }] }
        })
        .mockResolvedValueOnce({});

      const req = mockReq({}, { cartId: "c1" });
      const res = mockRes();
      await clearCart(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        items: []
      }));
    });

    it("should return 404 if cart not found", async () => {
      dynamoDB.send.mockResolvedValueOnce({ Item: null });

      const req = mockReq({}, { cartId: "nonexistent" });
      const res = mockRes();
      await clearCart(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  // ===== DELETE CART =====
  describe("deleteCart", () => {
    it("should delete cart successfully", async () => {
      dynamoDB.send
        .mockResolvedValueOnce({ Item: { cartId: "c1" } })
        .mockResolvedValueOnce({});

      const req = mockReq({}, { cartId: "c1" });
      const res = mockRes();
      await deleteCart(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: "Cart deleted successfully"
      }));
    });
  });

  // ===== GET CART SUMMARY =====
  describe("getCartSummary", () => {
    it("should return cart summary with totals", async () => {
      dynamoDB.send.mockResolvedValueOnce({
        Item: {
          cartId: "c1",
          items: [
            { productId: "p1", price: 100, quantity: 2 },
            { productId: "p2", price: 200, quantity: 1 }
          ]
        }
      });

      const req = mockReq({}, { cartId: "c1" });
      const res = mockRes();
      await getCartSummary(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        cartId: "c1",
        totalItems: 3,
        subtotal: 400
      }));
    });
  });
});
