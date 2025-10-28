const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true,
    required: [true, 'An article must have a title'],
  },
  source: {
    type: String,
    trim: true,
    required: [true, 'An article must have a source'],
  },
  source_logo_url: {
    type: String,
    trim: true,
  },
  url: {
    type: String,
    trim: true,
    unique: true,
    required: [true, 'An article must have a URL'],
  },
  thumbnail_url: {
    type: String,
    trim: true,
  },
  summary: {
    type: String,
    trim: true,
    required: [true, 'An article must have a summary'],
  },
  createdAt: {
    type: Date,
    default: Date.now(),
    select: false,
  },
});
const Article = mongoose.model('Article', articleSchema);

module.exports = Article;
