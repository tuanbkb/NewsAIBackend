const News = require('../models/newsModel');
const APIFeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.createNews = catchAsync(async (req, res, next) => {
  const newsItem = await News.create(req.body);
  res.status(201).json({
    status: 'success',
    data: {
      news: newsItem,
    },
  });
});

exports.getAllNews = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(News.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();
  const newsList = await features.query;
  res.status(200).json({
    status: 'success',
    results: newsList.length,
    data: {
      news: newsList,
    },
  });
});

exports.getNewsById = catchAsync(async (req, res, next) => {
  const newsItem = await News.findById(req.params.id);
  if (!newsItem) {
    return next(new AppError('No news found with that ID', 404));
  }
  res.status(200).json({
    status: 'success',
    data: {
      news: newsItem,
    },
  });
});

exports.updateNews = catchAsync(async (req, res, next) => {
  const newsItem = await News.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!newsItem) {
    return next(new AppError('No news found with that ID', 404));
  }
  res.status(200).json({
    status: 'success',
    data: {
      news: newsItem,
    },
  });
});

exports.deleteNews = catchAsync(async (req, res, next) => {
  const newsItem = await News.findByIdAndDelete(req.params.id);
  if (!newsItem) {
    return next(new AppError('No news found with that ID', 404));
  }
  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.deleteAllNews = catchAsync(async (req, res, next) => {
  await News.deleteMany();
  res.status(204).json({
    status: 'success',
    data: null,
  });
});
