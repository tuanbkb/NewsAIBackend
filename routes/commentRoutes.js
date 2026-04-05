const express = require('express');
const commentController = require('../controllers/commentController');
const authController = require('../controllers/authController');

const router = express.Router();

router.use(authController.protect);

router.route('/:id/like').patch(commentController.toggleLikeComment);

router
  .route('/:id')
  .get(commentController.getCommentById)
  .patch(commentController.updateComment)
  .delete(commentController.deleteComment);

module.exports = router;
