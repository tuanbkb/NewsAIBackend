const express = require('express');
const morgan = require('morgan');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const newsRouter = require('./routes/newsRoutes');
const userRouter = require('./routes/userRoutes');
const commentRouter = require('./routes/commentRoutes');
const aiRouter = require('./routes/aiRoutes');
const saveNewsRouter = require('./routes/saveNewsRoutes');
const trendRouter = require('./routes/trendRoutes');

const app = express();

// Middleware - Executed for every method after it
// Putting this after any router and that route won't execute the middleware
app.use(morgan('dev')); // Request logger

app.use(express.json());
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// Routes
app.use('/api/v1/news', newsRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/comments', commentRouter);
app.use('/api/v1/ai', aiRouter);
app.use('/api/v1/save-news', saveNewsRouter);
app.use('/api/v1/trends', trendRouter);

// Handling unhandled routes
app.use((req, res, next) => {
  // const err = new Error(`Can't find ${req.originalUrl} on this server!`);
  // err.statusCode = 404;
  // err.status = 'fail';
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Error handling middleware
app.use(globalErrorHandler);

module.exports = app;
