const express = require('express');
const googleNewsController = require('../controllers/googleNewsController');

const router = express.Router();

router
  .route('/')
  .post(googleNewsController.createGoogleNews)
  .get(googleNewsController.getAllGoogleNews)
  .delete(googleNewsController.deleteAllGoogleNews);

router.route('/crawl').post(googleNewsController.crawlGoogleNews);

router
  .route('/:id')
  .get(googleNewsController.getGoogleNewsById)
  .patch(googleNewsController.updateGoogleNews)
  .delete(googleNewsController.deleteGoogleNews);

module.exports = router;
