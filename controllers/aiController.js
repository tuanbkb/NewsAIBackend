const { getNewsFromArticlesSummary } = require('../services/openAi');
const catchAsync = require('../utils/catchAsync');

exports.getFinalSummary = catchAsync(async (req, res, next) => {
  const { summaries } = req.body;
  const aiResponse = await getNewsFromArticlesSummary(summaries);
  res.status(200).json({
    status: 'success',
    code: 200,
    data: aiResponse,
  });
});
