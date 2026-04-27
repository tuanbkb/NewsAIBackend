const { getNewsFromArticlesSummary } = require('../services/ollama');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');

exports.getFinalSummary = catchAsync(async (req, res, next) => {
  const { summaries } = req.body;
  const aiResponse = await getNewsFromArticlesSummary(summaries);

  await User.updateOne({ _id: req.user.id }, { $inc: { ai_search: 1 } });

  res.status(200).json({
    status: 'success',
    code: 200,
    data: aiResponse,
  });
});
