const express = require('express');
const router = express.Router();

const cartController = require('../controllers/cartController');

router.get('/', cartController.getAllCarts);

router.post('/', cartController.createCart);

router.get('/:cartId/summary', cartController.getCartSummary);

router.get('/:cartId', cartController.getCart);

router.post('/:cartId/add', cartController.addItem);

router.put('/:cartId/update', cartController.updateItemQuantity);

router.put('/:cartId', cartController.updateCart);

router.delete('/:cartId/remove/:productId', cartController.removeItem);

router.delete('/:cartId/clear', cartController.clearCart);

router.delete('/:cartId', cartController.deleteCart);

module.exports = router;