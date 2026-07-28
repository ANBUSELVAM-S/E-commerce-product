const express = require('express');
const router = express.Router();

const cartController = require('../controllers/cartController');
const { authenticateToken, authorizeGroups } = require('../middleware/auth');

// Protect all cart routes
router.use(authenticateToken);

// Owner-only validation middleware
const validateCartAccess = (req, res, next) => {
  const { cartId } = req.params;
  if (cartId && cartId !== `cart_${req.user.sub}` && !req.user.groups.includes("admin")) {
    return res.status(403).json({ message: "Forbidden: You can only access your own cart" });
  }
  next();
};

router.get('/', authorizeGroups(['admin']), cartController.getAllCarts);

router.post('/', cartController.createCart);

router.get('/:cartId/summary', validateCartAccess, cartController.getCartSummary);

router.get('/:cartId', validateCartAccess, cartController.getCart);

router.post('/:cartId/add', validateCartAccess, cartController.addItem);

router.put('/:cartId/update', validateCartAccess, cartController.updateItemQuantity);

router.put('/:cartId', validateCartAccess, cartController.updateCart);

router.delete('/:cartId/remove/:productId', validateCartAccess, cartController.removeItem);

router.delete('/:cartId/clear', validateCartAccess, cartController.clearCart);

router.delete('/:cartId', validateCartAccess, cartController.deleteCart);

module.exports = router;