const express = require('express');
const trendController = require('../controllers/trendController');

const router = express.Router();

router
  .route('/')
  .post(trendController.createTrend)
  .get(trendController.getAllTrends)
  .delete(trendController.deleteAllTrends);

router
  .route('/:id')
  .get(trendController.getTrendById)
  .patch(trendController.updateTrend)
  .delete(trendController.deleteTrend);

module.exports = router;
