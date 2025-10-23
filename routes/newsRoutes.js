const express = require('express');
const newsController = require('../controllers/newsController');

const router = express.Router();

router
  .route('/')
  .post(newsController.createNews)
  .get(newsController.getAllNews);

router.route('/:id').get(newsController.getNewsById);

module.exports = router;
