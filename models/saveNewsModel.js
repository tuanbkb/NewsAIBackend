const mongoose = require('mongoose');

const saveNewsSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'A saved news item must belong to a user'],
    },
    title: {
      type: String,
      trim: true,
      required: [true, 'A saved news item must have a title'],
    },
    content: {
      type: String,
      trim: true,
      required: [true, 'A saved news item must have content'],
    },
    references: {
      type: [
        {
          title: {
            type: String,
            trim: true,
          },
          url: {
            type: String,
            trim: true,
          },
          favicon: {
            type: String,
            trim: true,
          },
          source_name: {
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
  },
  {
    timestamps: true,
  },
);

saveNewsSchema.index({ user: 1, createdAt: -1 });

const SaveNews = mongoose.model('SaveNews', saveNewsSchema);

module.exports = SaveNews;
