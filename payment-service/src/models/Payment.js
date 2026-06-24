const mongoose = require('mongoose');
const crypto = require('crypto');

const paymentSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: [true, 'Order ID is required'],
    },
    userId: {
      type: String,
      required: [true, 'User ID is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    currency: {
      type: String,
      default: 'USD',
    },
    method: {
      type: String,
      enum: {
        values: ['credit_card', 'debit_card', 'paypal', 'bank_transfer', 'cash_on_delivery'],
        message: '{VALUE} is not a supported payment method',
      },
      required: [true, 'Payment method is required'],
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'completed', 'failed', 'refunded'],
        message: '{VALUE} is not a valid payment status',
      },
      default: 'pending',
    },
    transactionId: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-generate transactionId before saving if not set
paymentSchema.pre('save', function (next) {
  if (!this.transactionId) {
    this.transactionId = `txn_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }
  next();
});

module.exports = mongoose.model('Payment', paymentSchema);
