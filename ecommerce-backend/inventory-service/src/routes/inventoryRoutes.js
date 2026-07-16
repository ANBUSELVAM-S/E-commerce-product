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

// ----------------------------------------------------
// Special routes must come before /:productId
// ----------------------------------------------------

// GET /api/inventory/low-stock
router.get(
  "/low-stock",
  getLowStockItems
);

// GET /api/inventory/id/:id
router.get(
  "/id/:id",
  getInventoryById
);

// GET /api/inventory/product/:productId
router.get(
  "/product/:productId",
  getInventoryByProductId
);

// ----------------------------------------------------
// Create and get all inventory
// ----------------------------------------------------

// POST /api/inventory
// GET /api/inventory
router
  .route("/")
  .post(createInventory)
  .get(getAllInventory);

// ----------------------------------------------------
// Stock operations
// ----------------------------------------------------

// PATCH /api/inventory/:productId/adjust
router.patch(
  "/:productId/adjust",
  adjustStock
);

// GET /api/inventory/:productId/movements
router.get(
  "/:productId/movements",
  getMovementHistory
);

// ----------------------------------------------------
// Product inventory CRUD
// ----------------------------------------------------

// GET /api/inventory/:productId
router.get(
  "/:productId",
  getInventoryByProductId
);

// PUT /api/inventory/:productId
router.put(
  "/:productId",
  updateInventory
);

// DELETE /api/inventory/:productId
router.delete(
  "/:productId",
  deleteInventory
);

module.exports = router;