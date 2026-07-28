const express = require('express');
const router = express.Router();
const {
  initiatePayment,
  confirmPayment,
  failPayment,
  getTransactionsByOrderId,
  createPayment,
  getAllPayments,
  getPaymentById,
  updatePayment,
  deletePayment
} = require('../controllers/paymentController');
const { authenticateToken, authorizeGroups } = require('../middleware/auth');

// Protect all payment routes
router.use(authenticateToken);

// Custom Actions
router.post('/initiate', initiatePayment);
router.post('/confirm', confirmPayment);
router.post('/fail', failPayment);
router.get('/order/:orderId', getTransactionsByOrderId);

// Standard CRUD Operations
router.route('/')
  .post(createPayment)
  .get(getAllPayments);

router.route('/:id')
  .get(getPaymentById)
  .put(authorizeGroups(['admin']), updatePayment)
  .delete(authorizeGroups(['admin']), deletePayment);

module.exports = router;
