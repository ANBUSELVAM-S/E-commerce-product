const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a product name']
  },
  description: {
    type: String
  },
  price: {
    type: Number,
    required: [true, 'Please add a product price']
  },
  category: {
    type: String
  },
  stock: {
    type: Number,
    default: 0
  },
  imageUrl: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Product', productSchema);
