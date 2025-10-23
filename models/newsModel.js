const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'A news article must have a title'],
  },
  reference_articles_id: {
    type: [Number],
    required: [true, 'A news article must have reference articles IDs'],
  },
  data: {
    type: String,
    required: [true, 'A news article must have data'],
  },
});
const News = mongoose.model('News', newsSchema);

module.exports = News;
