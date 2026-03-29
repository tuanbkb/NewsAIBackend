const express = require('express');
const newsController = require('../controllers/newsController');
const authController = require('../controllers/authController');

const router = express.Router();

router
  .route('/')
  .post(newsController.createGoogleNews)
  .get(authController.protect, newsController.getAllGoogleNews)
  .delete(newsController.deleteAllGoogleNews);

router.route('/crawl').post(newsController.crawlGoogleNews);

router
  .route('/:id')
  .get(newsController.getGoogleNewsById)
  .patch(newsController.updateGoogleNews)
  .delete(newsController.deleteGoogleNews);

module.exports = router;
