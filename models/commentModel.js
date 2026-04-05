const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    news: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'News',
      required: [true, 'A comment must belong to a news item'],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'A comment must belong to a user'],
    },
    content: {
      type: String,
      trim: true,
      required: [true, 'A comment must have content'],
      minlength: [1, 'Comment cannot be empty'],
      maxlength: [2000, 'Comment cannot exceed 2000 characters'],
      validate: {
        validator: (value) => value.trim().length > 0,
        message: 'Comment cannot be empty',
      },
    },
    is_edited: {
      type: Boolean,
      default: false,
    },
    liked_by: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        select: false,
      },
    ],
  },
  {
    timestamps: true,
  },
);

commentSchema.index({ news: 1, createdAt: -1 });
commentSchema.index({ user: 1, createdAt: -1 });

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;
