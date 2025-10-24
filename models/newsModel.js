const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true,
    required: [true, 'A news article must have a title'],
  },
  reference_articles_id: {
    type: [Number],
    required: [true, 'A news article must have reference articles IDs'],
  },
  data: {
    type: String,
    trim: true,
    required: [true, 'A news article must have data'],
  },
  createdAt: {
    type: Date,
    default: Date.now(),
    select: false,
  },
});
const News = mongoose.model('News', newsSchema);

module.exports = News;
