const express = require('express');
const googleNewsController = require('../controllers/googleNewsController');
const authController = require('../controllers/authController');

const router = express.Router();

router
  .route('/')
  .post(googleNewsController.createGoogleNews)
  .get(authController.protect, googleNewsController.getAllGoogleNews)
  .delete(googleNewsController.deleteAllGoogleNews);

router.route('/crawl').post(googleNewsController.crawlGoogleNews);

router
  .route('/:id')
  .get(googleNewsController.getGoogleNewsById)
  .patch(googleNewsController.updateGoogleNews)
  .delete(googleNewsController.deleteGoogleNews);

module.exports = router;
