const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      required: [true, 'A news article must have a title'],
    },
    reference_articles: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Article',
      required: [true, 'A news article must have reference articles'],
    },
    data: {
      type: String,
      trim: true,
      required: [true, 'A news article must have data'],
    },
    category_ids: {
      type: [Number],
      required: [true, 'A news article must have categories'],
    },
  },
  {
    timestamps: true,
  },
);
const News = mongoose.model('News', newsSchema);

module.exports = News;
