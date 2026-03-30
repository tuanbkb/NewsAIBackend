const User = require('../models/userModel');
const News = require('../models/newsModel');
const factory = require('./handlerFactory');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.getAllUsers = factory.getAll(User);
exports.deleteAllUsers = factory.deleteAll(User);
exports.getUserById = factory.getById(User);
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);

exports.getMyFavoriteNews = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).populate('favorite_news');

  if (!user) {
    return next(new AppError('No user found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    code: 200,
    results: user.favorite_news.length,
    data: {
      data: user.favorite_news,
    },
  });
});

exports.addNewsToFavorites = catchAsync(async (req, res, next) => {
  const newsId = req.params.newsId || req.body.newsId;

  if (!newsId) {
    return next(new AppError('Please provide a newsId', 400));
  }

  const news = await News.findById(newsId);
  if (!news) {
    return next(new AppError('No news found with that ID', 404));
  }

  const alreadyFavorited = await User.exists({
    _id: req.user.id,
    favorite_news: newsId,
  });

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { $addToSet: { favorite_news: newsId } },
    { new: true, runValidators: true },
  ).populate('favorite_news');

  if (!alreadyFavorited) {
    await News.findByIdAndUpdate(newsId, { $inc: { favorite_count: 1 } });
  }

  res.status(200).json({
    status: 'success',
    code: 200,
    results: user.favorite_news.length,
    data: {
      data: user.favorite_news,
    },
  });
});

exports.removeNewsFromFavorites = catchAsync(async (req, res, next) => {
  const newsId = req.params.newsId || req.body.newsId;

  if (!newsId) {
    return next(new AppError('Please provide a newsId', 400));
  }

  const alreadyFavorited = await User.exists({
    _id: req.user.id,
    favorite_news: newsId,
  });

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { $pull: { favorite_news: newsId } },
    { new: true, runValidators: true },
  ).populate('favorite_news');

  if (alreadyFavorited) {
    await News.updateOne(
      { _id: newsId, favorite_count: { $gt: 0 } },
      { $inc: { favorite_count: -1 } },
    );
  }

  res.status(200).json({
    status: 'success',
    code: 200,
    results: user.favorite_news.length,
    data: {
      data: user.favorite_news,
    },
  });
});
