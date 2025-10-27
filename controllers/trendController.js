const Trend = require('../models/trendModel');
const factory = require('./handlerFactory');

exports.createTrend = factory.createOne(Trend);
exports.getAllTrends = factory.getAll(Trend);
exports.getTrendById = factory.getById(Trend);
exports.updateTrend = factory.updateOne(Trend);
exports.deleteTrend = factory.deleteOne(Trend);
exports.deleteAllTrends = factory.deleteAll(Trend);
