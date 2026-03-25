const express = require('express');
const userController = require('../controllers/authController');

const router = express.Router();

router.post('/signup', userController.signUp);

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
