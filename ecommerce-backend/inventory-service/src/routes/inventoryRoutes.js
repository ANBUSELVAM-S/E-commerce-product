const express = require("express");
const router = express.Router();

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
} = require("../controllers/inventoryController");
const { authenticateToken, authorizeGroups } = require("../middleware/auth");



// ----------------------------------------------------
// Special routes must come before /:productId
// ----------------------------------------------------

// GET /api/inventory/low-stock
router.get(
  "/low-stock",
  authorizeGroups(["admin", "engineer"]),
  getLowStockItems
);

// GET /api/inventory/id/:id
router.get(
  "/id/:id",
  authorizeGroups(["admin", "engineer"]),
  getInventoryById
);

// GET /api/inventory/product/:productId
router.get(
  "/product/:productId",
  authorizeGroups(["admin", "engineer"]),
  getInventoryByProductId
);

// ----------------------------------------------------
// Create and get all inventory
// ----------------------------------------------------

router.post("/", createInventory);
router.get("/", getAllInventory);


// ----------------------------------------------------
// Stock operations
// ----------------------------------------------------

// PATCH /api/inventory/:productId/adjust
// Allow all authenticated users (needed for checkout flow)
router.patch(
  "/:productId/adjust",
  adjustStock
);

// GET /api/inventory/:productId/movements
router.get(
  "/:productId/movements",
  authorizeGroups(["admin", "engineer"]),
  getMovementHistory
);

// ----------------------------------------------------
// Product inventory CRUD
// ----------------------------------------------------

// GET /api/inventory/:productId
router.get(
  "/:productId",
  authorizeGroups(["admin", "engineer"]),
  getInventoryByProductId
);

// PUT /api/inventory/:productId
router.put(
  "/:productId",
  authorizeGroups(["admin", "engineer"]),
  updateInventory
);

// DELETE /api/inventory/:productId
router.delete(
  "/:productId",
  authorizeGroups(["admin"]),
  deleteInventory
);

module.exports = router;