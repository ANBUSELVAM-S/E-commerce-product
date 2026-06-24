const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    unique: true
  },
  orderId: {
    type: String,
    required: [true, 'orderId is required']
  },
  amount: {
    type: Number,
    required: [true, 'amount is required']
  },
  method: {
    type: String,
    enum: ['card', 'upi', 'netbanking', 'cod'],
    required: [true, 'method is required']
  },
  status: {
    type: String,
    enum: ['pending', 'success', 'failed'],
    default: 'pending'
  },
  paidAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

transactionSchema.pre('save', function(next) {
  if (!this.transactionId) {
    this.transactionId = 'TXN-' + Date.now();
  }
  next();
});

module.exports = mongoose.model('Transaction', transactionSchema);
