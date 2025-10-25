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
    console.error('ERROR 💥:', err);
    res.status(500).json({
      status: 'error',
      code: 500,
      message: 'Something went wrong!',
      error: err, //remove in production
    });
  } else {
    console.log('Operational error:', err);
    res.status(err.statusCode).json({
      status: err.status,
      code: err.statusCode,
      message: err.message || 'Something went wrong!',
      error: err, //remove in production
    });
  }
};

// Error handling middleware
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  let error = { ...err };

  if (err instanceof mongoose.Error.CastError) error = handleCastErrorDB(err);
  if (err.code === 11000) error = handleDuplicateFieldsDB(err);
  if (err instanceof mongoose.Error.ValidationError)
    error = handleValidationErrorDB(err);

  sendError(error, res);
};
