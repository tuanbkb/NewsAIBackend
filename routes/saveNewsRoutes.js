const express = require('express');
const authController = require('../controllers/authController');
const saveNewsController = require('../controllers/saveNewsController');

const router = express.Router();

router.use(authController.protect);

router
  .route('/')
  .post(saveNewsController.createSaveNews)
  .get(saveNewsController.getMySaveNews);

router
  .route('/:id')
  .patch(saveNewsController.updateSaveNewsTitle)
  .delete(saveNewsController.deleteSaveNewsById);

module.exports = router;
