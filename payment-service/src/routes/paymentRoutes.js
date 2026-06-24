const express = require('express');
const router = express.Router();
const {
  initiatePayment,
  confirmPayment,
  failPayment,
  getTransactionById,
  getTransactionsByOrderId
} = require('../controllers/paymentController');

router.post('/initiate', initiatePayment);
router.post('/confirm', confirmPayment);
router.post('/fail', failPayment);
router.get('/order/:orderId', getTransactionsByOrderId);
router.get('/:transactionId', getTransactionById);

module.exports = router;
