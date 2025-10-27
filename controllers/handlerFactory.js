const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const newsItem = await Model.findByIdAndDelete(req.params.id);
    if (!newsItem) {
      return next(new AppError('No document found with that ID', 404));
    }
    res.status(204).json({
      status: 'success',
      code: 204,
      data: null,
    });
  });

exports.deleteAll = (Model) =>
  catchAsync(async (req, res, next) => {
    await Model.deleteMany();
    res.status(204).json({
      status: 'success',
      code: 204,
      data: null,
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
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

exports.getById = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findById(req.params.id);
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

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);
    res.status(201).json({
      status: 'success',
      code: 201,
      data: {
        data: doc,
      },
    });
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    const features = new APIFeatures(Model.find(), req.query)
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

      const totalDocs = await Model.countDocuments(filterObj);
      const limit = req.query.limit * 1 || 100;
      const totalPages = Math.ceil(totalDocs / limit);
      const docs = await features.paginate().query;
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
      const docs = await features.query;
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
