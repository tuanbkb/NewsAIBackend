const GoogleNews = require('../models/newsModel');
const factory = require('./handlerFactory');
const {
  getPopularNews,
  getNewsFromKeyword,
} = require('../services/googleNews');
const catchAsync = require('../utils/catchAsync');

exports.createGoogleNews = factory.createOne(GoogleNews);
exports.getAllGoogleNews = factory.getAll(GoogleNews);
exports.getGoogleNewsById = factory.getById(GoogleNews);
exports.updateGoogleNews = factory.updateOne(GoogleNews);
exports.deleteGoogleNews = factory.deleteOne(GoogleNews);
exports.deleteAllGoogleNews = factory.deleteAll(GoogleNews);

// Crawl and save popular news from Google News
exports.crawlGoogleNews = catchAsync(async (req, res, next) => {
  const { language = 'vi', countryCode = 'VN' } = req.query;
  const data = await getPopularNews(language, countryCode);
  res.status(201).json({
    status: 'success',
    code: 201,
    results: data.length,
    data: {
      data,
    },
  });
});

exports.getNewsFromKeyword = catchAsync(async (req, res, next) => {
  const { keyword, language = 'vi', countryCode = 'VN' } = req.query;
  const data = await getNewsFromKeyword(keyword, language, countryCode);
  res.status(200).json({
    status: 'success',
    code: 200,
    results: data.length,
    data: {
      data,
    },
  });
});
