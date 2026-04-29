const catchAsync = require('../utils/catchAsync');
const getTrends = require('../services/trend');

exports.getTrends = catchAsync(async (req, res, next) => {
  const data = await getTrends();
  res.status(200).json({
    status: 'success',
    code: 200,
    data: data,
  });
});
