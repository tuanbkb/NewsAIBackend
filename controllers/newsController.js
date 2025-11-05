const News = require('../models/newsModel');
const factory = require('./handlerFactory');
const catchAsync = require('../utils/catchAsync');
const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');

exports.createNews = factory.createOne(News);
// exports.getAllNews = factory.getAll(News);
// exports.getNewsById = factory.getById(News);
exports.updateNews = factory.updateOne(News);
exports.deleteNews = factory.deleteOne(News);
exports.deleteAllNews = factory.deleteAll(News);

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

    const totalDocs = await News.countDocuments(filterObj);
    const limit = req.query.limit * 1 || 100;
    const totalPages = Math.ceil(totalDocs / limit);
    const docs = await features
      .paginate()
      .populate('reference_articles', '-summary -createdAt')
      .lean().query;
    res.status(200).json({
      status: 'success',
      code: 200,
      data: {
        data: docs,
        page_info: {
          currentPage: req.query.page * 1 || 1,
          limit,
          totalPages,
          count: totalDocs,
        },
      },
    });
  } else {
    const docs = await features
      .populate('reference_articles', '-summary -createdAt')
      .lean().query;
    res.status(200).json({
      status: 'success',
      code: 200,
      results: docs.length,
      data: {
        data: docs,
      },
    });
  }
});

exports.getNewsById = catchAsync(async (req, res, next) => {
  const doc = await News.findById(req.params.id)
    .populate({ path: 'reference_articles', select: '-summary -createdAt' })
    .lean();
  if (!doc) {
    return next(new AppError('No document found with that ID', 404));
  }
  res.status(200).json({
    status: 'success',
    code: 200,
    data: {
      data: doc,
    },
  });
});
