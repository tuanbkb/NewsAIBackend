const express = require('express');
const articleController = require('../controllers/articleController');

const router = express.Router();

router
  .route('/')
  .post(articleController.createArticle)
  .get(articleController.getAllArticles)
  .delete(articleController.deleteAllArticles);

router
  .route('/:id')
  .get(articleController.getArticleById)
  .patch(articleController.updateArticle)
  .delete(articleController.deleteArticle);

module.exports = router;
