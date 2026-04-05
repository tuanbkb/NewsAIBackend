const express = require('express');
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');

const router = express.Router();

router.post('/signup', authController.signUp);
router.post('/signin', authController.signIn);

router.get(
  '/me/favorites',
  authController.protect,
  userController.getMyFavoriteNews,
);
router.post(
  '/me/favorites/:newsId',
  authController.protect,
  userController.addNewsToFavorites,
);
router.delete(
  '/me/favorites/:newsId',
  authController.protect,
  userController.removeNewsFromFavorites,
);
router.patch(
  '/me/ai-search/increase',
  authController.protect,
  userController.increaseMyAiSearch,
);

router
  .route('/')
  .get(userController.getAllUsers)
  .delete(userController.deleteAllUsers);

router
  .route('/:id')
  .get(userController.getUserById)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
