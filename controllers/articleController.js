const Article = require('../models/articleModel');
const factory = require('./handlerFactory');

exports.createArticle = factory.createOne(Article);
exports.getAllArticles = factory.getAll(Article);
exports.getArticleById = factory.getById(Article);
exports.updateArticle = factory.updateOne(Article);
exports.deleteArticle = factory.deleteOne(Article);
exports.deleteAllArticles = factory.deleteAll(Article);
