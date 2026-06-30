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

// Specific routes first
router.get('/low-stock', getLowStockItems);
router.get('/product/:productId', getInventoryByProductId);

// Generic CRUD and ID-based routes
router.route('/')
  .post(createInventory)
  .get(getAllInventory);

router.route('/:id')
  .get(getInventoryById)
  .put(updateInventory)
  .delete(deleteInventory);

router.patch('/:id/adjust', adjustStock);
router.get('/:id/movements', getMovementHistory);

module.exports = router;
