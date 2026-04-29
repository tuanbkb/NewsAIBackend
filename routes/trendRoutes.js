const express = require('express');
const trendController = require('../controllers/trendController');

const router = express.Router();

router.get('/', trendController.getTrends);

module.exports = router;
