const express = require('express');
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
} = require('../controllers/inventoryController');

// ===============================
// Special Routes
// ===============================

// Get Low Stock Items
router.get('/low-stock', getLowStockItems);

// Get Inventory by Product ID
router.get('/product/:productId', getInventoryByProductId);

// ===============================
// CRUD Operations
// ===============================

// Create Inventory
// Get All Inventory
router
  .route('/')
  .post(createInventory)
  .get(getAllInventory);

// Get Inventory By Product ID
// Update Inventory
// Delete Inventory
router
  .route('/:productId')
  .get(getInventoryById)
  .put(updateInventory)
  .delete(deleteInventory);

// ===============================
// Stock Operations
// ===============================

// Adjust Stock
router.patch('/:productId/adjust', adjustStock);

// Movement History
router.get('/:productId/movements', getMovementHistory);

module.exports = router;