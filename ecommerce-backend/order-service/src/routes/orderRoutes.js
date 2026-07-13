const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrders,
  getOrderById,
  deleteOrder,
  cancelOrder,
  payOrder
} = require('../controllers/orderController');

router.route('/')
  .post(createOrder)
  .get(getOrders);

router.route('/:id')
  .get(getOrderById)
  .delete(deleteOrder);

router.route('/:id/cancel')
  .put(cancelOrder);

// The patch endpoint expects orderId specifically
router.route('/:orderId/pay')
  .patch(payOrder);

module.exports = router;
