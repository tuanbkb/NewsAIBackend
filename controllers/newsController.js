const News = require('../models/newsModel');
const APIFeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.createNews = catchAsync(async (req, res, next) => {
  const newsItem = await News.create(req.body);
  res.status(201).json({
    status: 'success',
    code: 201,
    data: {
      news: newsItem,
    },
  });
});

exports.getAllNews = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(News.find(), req.query)
    .filter()
    .sort()
    .limitFields();

  // Pagination if the request includes page or limit query parameters
  if (req.query.page || req.query.limit) {
    let filterObj = {};
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

    const totalNews = await News.countDocuments(filterObj);
    const limit = req.query.limit * 1 || 100;
    const totalPages = Math.ceil(totalNews / limit);
    const newsList = await features.paginate().query;
    res.status(200).json({
      status: 'success',
      code: 200,
      data: {
        news: newsList,
        page_info: {
          currentPage: req.query.page * 1 || 1,
          limit,
          totalPages,
          count: totalNews,
        },
      },
    });
  } else {
    const newsList = await features.query;
    res.status(200).json({
      status: 'success',
      code: 200,
      results: newsList.length,
      data: {
        news: newsList,
      },
    });
  }
});

exports.getNewsById = catchAsync(async (req, res, next) => {
  const newsItem = await News.findById(req.params.id);
  if (!newsItem) {
    return next(new AppError('No news found with that ID', 404));
  }
  res.status(200).json({
    status: 'success',
    code: 200,
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
    code: 200,
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
    code: 204,
    data: null,
  });
});

exports.deleteAllNews = catchAsync(async (req, res, next) => {
  await News.deleteMany();
  res.status(204).json({
    status: 'success',
    code: 204,
    data: null,
  });
});
