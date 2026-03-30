const { default: mongoose } = require('mongoose');

const newsSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      required: [true, 'A Google News article must have a title'],
    },
    content: {
      type: String,
      trim: true,
      required: [true, 'A Google News article must have content'],
    },
    embedded_link: {
      type: String,
      trim: true,
      required: [true, 'A Google News article must have an embedded link'],
    },
    pub_date: {
      type: Date,
      required: [true, 'A Google News article must have a publication date'],
    },
    source: {
      type: String,
      trim: true,
    },
    references: {
      type: [
        {
          url: {
            type: String,
            trim: true,
          },
          summary: {
            type: String,
            trim: true,
          },
          thumbnail: {
            type: String,
            trim: true,
          },
        },
      ],

      default: [],
    },
    media: {
      type: [String],
      trim: true,
    },
    comments_count: {
      type: Number,
      default: 0,
      min: [0, 'Comment count cannot be negative'],
    },
    favorite_count: {
      type: Number,
      default: 0,
      min: [0, 'Favorite count cannot be negative'],
    },
  },
  {
    timestamps: true,
  },
);

const News = mongoose.model('News', newsSchema);

module.exports = News;
