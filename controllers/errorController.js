const mongoose = require('mongoose');
const AppError = require('../utils/appError');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.keyValue ? JSON.stringify(err.keyValue) : 'duplicate field';
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data: ${errors.join('. ')}`;
  return new AppError(message, 400);
};

// Function to send error response
const sendError = (err, res) => {
  if (!err.isOperational) {
    // Programming or other unknown error: don't leak error details
    res.status(500).json({
      status: 'error',
      code: 500,
      message: 'Something went wrong!',
      error: err, //remove in production
    });
  } else {
    res.status(err.statusCode).json({
      status: err.status,
      code: err.statusCode,
      message: err.message,
      error: err, //remove in production
    });
  }
};

// Error handling middleware
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  err.message = err.message || 'Something went wrong!';

  let error = err;

  if (error instanceof mongoose.Error.CastError)
    error = handleCastErrorDB(error);
  if (error.code === 11000) error = handleDuplicateFieldsDB(error);
  if (error instanceof mongoose.Error.ValidationError)
    error = handleValidationErrorDB(error);

  sendError(error, res);
};
