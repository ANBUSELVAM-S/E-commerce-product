const express = require('express');
const router = express.Router();
const {
  createCart,
  getCart,
  addItem,
  updateItemQuantity,
  removeItem,
  clearCart,
  getCartSummary
} = require('../controllers/cartController');

router.post('/', createCart);
router.get('/:cartId', getCart);
router.post('/:cartId/add', addItem);
router.put('/:cartId/update', updateItemQuantity);
router.delete('/:cartId/remove/:productId', removeItem);
router.delete('/:cartId/clear', clearCart);
router.get('/:cartId/summary', getCartSummary);

module.exports = router;
