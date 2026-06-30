const mongoose = require('mongoose');

const searchLogSchema = new mongoose.Schema({
  query: {
    type: String,
    required: true
  },
  resultsCount: {
    type: Number,
    default: 0
  },
  filters: {
    type: Object,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('SearchLog', searchLogSchema);
