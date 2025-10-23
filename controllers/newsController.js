const News = require('../models/newsModel');

exports.createNews = async (req, res) => {
  try {
    const newsItem = await News.create(req.body);
    res.status(201).json({
      status: 'success',
      data: {
        news: newsItem,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.getAllNews = async (req, res) => {
  try {
    const newsList = await News.find();
    res.status(200).json({
      status: 'success',
      results: newsList.length,
      data: {
        news: newsList,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.getNewsById = async (req, res) => {
  try {
    const newsItem = await News.findById(req.params.id);
    res.status(200).json({
      status: 'success',
      data: {
        news: newsItem,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};
