const Transaction = require('../models/Transaction');
const axios = require('axios');

const getOrderServiceUrl = () => process.env.ORDER_SERVICE_URL || 'http://localhost:5003';

// POST /api/payments/initiate
const initiatePayment = async (req, res) => {
  try {
    const { orderId, amount, method } = req.body;

    if (!orderId || amount === undefined || !method) {
      return res.status(400).json({ message: 'orderId, amount, and method are required' });
    }

    const validMethods = ['card', 'upi', 'netbanking', 'cod'];
    if (!validMethods.includes(method)) {
      return res.status(400).json({ message: `Invalid method. Must be one of: ${validMethods.join(', ')}` });
    }

    const transaction = new Transaction({
      orderId,
      amount,
      method,
      status: 'pending'
    });

    const savedTransaction = await transaction.save();

    res.status(201).json({
      transactionId: savedTransaction.transactionId,
      orderId: savedTransaction.orderId,
      amount: savedTransaction.amount,
      method: savedTransaction.method,
      status: savedTransaction.status
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/payments/confirm
const confirmPayment = async (req, res) => {
  try {
    const { transactionId } = req.body;

    if (!transactionId) {
      return res.status(400).json({ message: 'transactionId is required' });
    }

    const transaction = await Transaction.findOne({ transactionId });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (transaction.status === 'success') {
      return res.status(400).json({ message: 'Transaction is already confirmed' });
    }

    transaction.status = 'success';
    transaction.paidAt = Date.now();
    const updatedTransaction = await transaction.save();

    // Call PATCH http://localhost:5003/api/orders/:orderId/pay
    try {
      await axios.patch(`${getOrderServiceUrl()}/api/orders/${transaction.orderId}/pay`);
    } catch (err) {
      console.error(`Failed to update order ${transaction.orderId} status:`, err.message);
      // Note: we continue execution so we return the success message to client
    }

    res.json(updatedTransaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/payments/fail
const failPayment = async (req, res) => {
  try {
    const { transactionId } = req.body;

    if (!transactionId) {
      return res.status(400).json({ message: 'transactionId is required' });
    }

    const transaction = await Transaction.findOne({ transactionId });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    transaction.status = 'failed';
    const updatedTransaction = await transaction.save();

    res.json(updatedTransaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/payments/:transactionId
const getTransactionById = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({ transactionId: req.params.transactionId });

    if (transaction) {
      res.json(transaction);
    } else {
      res.status(404).json({ message: 'Transaction not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/payments/order/:orderId
const getTransactionsByOrderId = async (req, res) => {
  try {
    const transactions = await Transaction.find({ orderId: req.params.orderId }).sort({ createdAt: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  initiatePayment,
  confirmPayment,
  failPayment,
  getTransactionById,
  getTransactionsByOrderId
};
