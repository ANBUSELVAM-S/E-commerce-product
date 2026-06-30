const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  notificationId: {
    type: String,
    unique: true
  },
  userId: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['order_placed', 'order_confirmed', 'order_cancelled', 'payment_success', 'payment_failed', 'low_stock', 'general'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  metadata: {
    type: Object,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

notificationSchema.pre('save', function(next) {
  if (!this.notificationId) {
    this.notificationId = 'NOTIF-' + Date.now();
  }
  next();
});

module.exports = mongoose.model('Notification', notificationSchema);
