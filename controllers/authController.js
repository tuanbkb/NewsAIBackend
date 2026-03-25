const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');

exports.signUp = catchAsync(async (req, res, next) => {
  const newUser = User.create(res.body);

  res.status(201).json({
    status: 'success',
    code: 201,
    data: {
      user: newUser,
    },
  });
});
