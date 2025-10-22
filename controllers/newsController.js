exports.get = (req, res) => {
  res.status(200).json({
    status: 'success',
    code: 200,
    message:
      'This is the hello message. If you see this, you have successfully connected to the NewsAI backend!',
    requestedAt: req.requestTime,
  });
};

exports.post = (req, res) => {
  res
    .status(200)
    .json({ data: req.body, message: 'You can post to this endpoint' });
};
