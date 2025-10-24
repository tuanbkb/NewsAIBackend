const express = require('express');
const newsController = require('../controllers/newsController');

const router = express.Router();

router
  .route('/')
  .post(newsController.createNews)
  .get(newsController.getAllNews)
  .delete(newsController.deleteAllNews);

router
  .route('/:id')
  .get(newsController.getNewsById)
  .patch(newsController.updateNews)
  .delete(newsController.deleteNews);

module.exports = router;
