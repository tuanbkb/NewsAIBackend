const GoogleNews = require('../models/googleNewsModel');
const factory = require('./handlerFactory');
const { getPopularNews } = require('../services/googleNews');
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
