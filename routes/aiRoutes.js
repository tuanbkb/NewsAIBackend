const express = require('express');
const aiController = require('../controllers/aiController');
const authController = require('../controllers/authController');

const router = express.Router();

router.route('/').post(authController.protect, aiController.getFinalSummary);

module.exports = router;
