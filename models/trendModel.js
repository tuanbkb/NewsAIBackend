const mongoose = require('mongoose');

const trendSchema = new mongoose.Schema({
  query: {
    type: String,
    unique: true,
    trim: true,
    required: [true, 'A trend must have a query'],
  },
  start_timestamp: {
    type: Date,
    required: [true, 'A trend must have a start timestamp'],
  },
  end_timestamp: {
    type: Date,
  },
  search_volume: {
    type: Number,
    required: [true, 'A trend must have a search volume'],
  },
  increase_percentage: {
    type: Number,
    required: [true, 'A trend must have an increase percentage'],
  },
  category_ids: {
    type: [Number],
    required: [true, 'A trend must have categories'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
    select: false,
  },
});

const Trend = mongoose.model('Trend', trendSchema);

module.exports = Trend;
