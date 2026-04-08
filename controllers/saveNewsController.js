const SaveNews = require('../models/saveNewsModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

exports.createSaveNews = catchAsync(async (req, res, next) => {
  const { title, content, references = [], media = [] } = req.body;

  if (!title || !title.trim()) {
    return next(new AppError('Please provide a title', 400));
  }

  if (!content || !content.trim()) {
    return next(new AppError('Please provide content', 400));
  }

  const saveNews = await SaveNews.create({
    user: req.user.id,
    title: title.trim(),
    content: content.trim(),
    references,
    media,
  });

  return res.status(201).json({
    status: 'success',
    code: 201,
    data: {
      data: saveNews,
    },
  });
});

exports.getMySaveNews = catchAsync(async (req, res, next) => {
  const baseFilter = { user: req.user.id };

  const features = new APIFeatures(SaveNews.find(baseFilter), req.query)
    .filter()
    .sort()
    .limitFields();

  if (req.query.page || req.query.limit) {
    let filterObj = { ...baseFilter };

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

    const totalDocs = await SaveNews.countDocuments(filterObj);
    const limit = req.query.limit * 1 || 100;
    const totalPages = Math.ceil(totalDocs / limit);
    const saveNewsList = await features.paginate().lean().query;

    return res.status(200).json({
      status: 'success',
      code: 200,
      data: {
        data: saveNewsList,
        page_info: {
          currentPage: req.query.page * 1 || 1,
          limit,
          totalPages,
          count: totalDocs,
        },
      },
    });
  }

  const saveNewsList = await features.lean().query;

  return res.status(200).json({
    status: 'success',
    code: 200,
    results: saveNewsList.length,
    data: {
      data: saveNewsList,
    },
  });
});

exports.updateSaveNewsTitle = catchAsync(async (req, res, next) => {
  const { title } = req.body;

  if (!title || !title.trim()) {
    return next(new AppError('Please provide a title', 400));
  }

  const saveNews = await SaveNews.findOneAndUpdate(
    {
      _id: req.params.id,
      user: req.user.id,
    },
    {
      title: title.trim(),
    },
    {
      new: true,
      runValidators: true,
    },
  );

  if (!saveNews) {
    return next(new AppError('No saved news found with that ID', 404));
  }

  return res.status(200).json({
    status: 'success',
    code: 200,
    data: {
      data: saveNews,
    },
  });
});

exports.deleteSaveNewsById = catchAsync(async (req, res, next) => {
  const saveNews = await SaveNews.findOneAndDelete({
    _id: req.params.id,
    user: req.user.id,
  });

  if (!saveNews) {
    return next(new AppError('No saved news found with that ID', 404));
  }

  return res.status(204).json({
    status: 'success',
    code: 204,
    data: null,
  });
});
