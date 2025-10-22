const express = require('express');
const newsController = require('../controllers/newsController');

const router = express.Router();

router.route('/').get(newsController.get).post(newsController.post);

module.exports = router;
