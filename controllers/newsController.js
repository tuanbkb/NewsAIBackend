const News = require('../models/newsModel');
const factory = require('./handlerFactory');

exports.createNews = factory.createOne(News);
exports.getAllNews = factory.getAll(News);
exports.getNewsById = factory.getById(News);
exports.updateNews = factory.updateOne(News);
exports.deleteNews = factory.deleteOne(News);
exports.deleteAllNews = factory.deleteAll(News);
