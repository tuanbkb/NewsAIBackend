const Comment = require('../models/commentModel');
const News = require('../models/newsModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

const ensureCommentOwner = (comment, userId) => {
  if (comment.user.toString() !== userId) {
    return false;
  }

  return true;
};

exports.createComment = catchAsync(async (req, res, next) => {
  const newsId = req.params.newsId || req.body.news;
  const { content } = req.body;

  if (!newsId) {
    return next(new AppError('Please provide a newsId', 400));
  }

  if (!content || !content.trim()) {
    return next(new AppError('Please provide comment content', 400));
  }

  const news = await News.findById(newsId);
  if (!news) {
    return next(new AppError('No news found with that ID', 404));
  }

  const comment = await Comment.create({
    news: newsId,
    user: req.user.id,
    content: content.trim(),
  });

  await News.findByIdAndUpdate(newsId, { $inc: { comments_count: 1 } });
  await comment.populate({ path: 'user', select: 'name avatar' });

  res.status(201).json({
    status: 'success',
    code: 201,
    data: {
      data: comment,
    },
  });
});

exports.getCommentsByNews = catchAsync(async (req, res, next) => {
  const { newsId } = req.params;
  const news = await News.findById(newsId).select('_id');

  if (!news) {
    return next(new AppError('No news found with that ID', 404));
  }

  const features = new APIFeatures(Comment.find({ news: newsId }), req.query)
    .filter()
    .sort()
    .limitFields()
    .populate('user', 'name avatar');

  if (req.query.page || req.query.limit) {
    let filterObj = { news: newsId };

    if (features.query && typeof features.query.getFilter === 'function') {
      filterObj = features.query.getFilter();
    } else if (
      features.query &&
      typeof features.query.getQuery === 'function'
    ) {
      filterObj = features.query.getQuery();
    } else if (features.query && features.query._conditions) {
      filterObj = features.query._conditions;
    }

    const totalDocs = await Comment.countDocuments(filterObj);
    const limit = req.query.limit * 1 || 100;
    const totalPages = Math.ceil(totalDocs / limit);
    const comments = await features.paginate().lean().query;

    return res.status(200).json({
      status: 'success',
      code: 200,
      data: {
        data: comments,
        page_info: {
          currentPage: req.query.page * 1 || 1,
          limit,
          totalPages,
          count: totalDocs,
        },
      },
    });
  }

  const comments = await features.lean().query;

  return res.status(200).json({
    status: 'success',
    code: 200,
    results: comments.length,
    data: {
      data: comments,
    },
  });
});

exports.getCommentById = catchAsync(async (req, res, next) => {
  const comment = await Comment.findById(req.params.id).populate({
    path: 'user',
    select: 'name avatar',
  });

  if (!comment) {
    return next(new AppError('No comment found with that ID', 404));
  }

  return res.status(200).json({
    status: 'success',
    code: 200,
    data: {
      data: comment,
    },
  });
});

exports.updateComment = catchAsync(async (req, res, next) => {
  const { content } = req.body;

  if (!content || !content.trim()) {
    return next(new AppError('Please provide comment content', 400));
  }

  const comment = await Comment.findById(req.params.id);
  if (!comment) {
    return next(new AppError('No comment found with that ID', 404));
  }

  if (!ensureCommentOwner(comment, req.user.id)) {
    return next(
      new AppError('You are not allowed to modify this comment', 403),
    );
  }

  comment.content = content.trim();
  comment.isEdited = true;
  await comment.save();
  await comment.populate({ path: 'user', select: 'name avatar' });

  return res.status(200).json({
    status: 'success',
    code: 200,
    data: {
      data: comment,
    },
  });
});

exports.deleteComment = catchAsync(async (req, res, next) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment) {
    return next(new AppError('No comment found with that ID', 404));
  }

  if (!ensureCommentOwner(comment, req.user.id)) {
    return next(
      new AppError('You are not allowed to modify this comment', 403),
    );
  }

  await Comment.findByIdAndDelete(req.params.id);
  await News.updateOne(
    { _id: comment.news, comments_count: { $gt: 0 } },
    { $inc: { comments_count: -1 } },
  );

  return res.status(204).json({
    status: 'success',
    code: 204,
    data: null,
  });
});
