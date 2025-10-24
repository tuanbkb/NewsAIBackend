const News = require('../models/newsModel');
const APIFeatures = require('../utils/apiFeatures');

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
    const features = new APIFeatures(News.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    const newsList = await features.query;
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

exports.updateNews = async (req, res) => {
  try {
    const newsItem = await News.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
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

exports.deleteNews = async (req, res) => {
  try {
    await News.findByIdAndDelete(req.params.id);
    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.deleteAllNews = async (req, res) => {
  try {
    await News.deleteMany();
    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};
