const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  productId: {
    type: String,
    required: true,
    unique: true
  },
  productName: {
    type: String,
    required: true
  },
  currentStock: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  reservedStock: {
    type: Number,
    default: 0,
    min: 0
  },
  availableStock: {
    type: Number,
    default: 0
  },
  lowStockThreshold: {
    type: Number,
    default: 10
  },
  movements: [{
    type: {
      type: String,
      enum: ['addition', 'removal', 'reservation', 'release', 'adjustment'],
      required: true
    },
    quantity: {
      type: Number,
      required: true
    },
    reason: {
      type: String
    },
    date: {
      type: Date,
      default: Date.now
    }
  }],
  updatedAt: {
    type: Date
  }
});

inventorySchema.pre('save', function(next) {
  this.availableStock = this.currentStock - this.reservedStock;
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Inventory', inventorySchema);
