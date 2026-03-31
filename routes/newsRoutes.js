const express = require('express');
const newsController = require('../controllers/newsController');
const authController = require('../controllers/authController');
const commentController = require('../controllers/commentController');

const router = express.Router();

router
  .route('/search')
  .get(authController.protect, newsController.getNewsFromKeyword);

router
  .route('/')
  .post(newsController.createGoogleNews)
  .get(authController.protect, newsController.getAllGoogleNews)
  .delete(newsController.deleteAllGoogleNews);

router.route('/crawl').post(newsController.crawlGoogleNews);

router
  .route('/:newsId/comments')
  .get(commentController.getCommentsByNews)
  .post(authController.protect, commentController.createComment);

router
  .route('/:id')
  .get(newsController.getGoogleNewsById)
  .patch(newsController.updateGoogleNews)
  .delete(newsController.deleteGoogleNews);

module.exports = router;
