const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  updateStock
} = require('../controllers/productController');
const { authenticateToken, authorizeGroups } = require('../middleware/auth');

// Protect all product routes
router.use(authenticateToken);

router.route('/')
  .get(getProducts)
  .post(authorizeGroups(['admin']), createProduct);

router.route('/:id')
  .get(getProductById)
  .put(authorizeGroups(['admin']), updateProduct)
  .delete(authorizeGroups(['admin']), deleteProduct);

router.route('/:id/stock')
  .patch(authorizeGroups(['admin']), updateStock);

module.exports = router;

//connecting..........