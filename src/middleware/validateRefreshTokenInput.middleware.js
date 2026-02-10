const { sendError } = require('../utils/response');

module.exports = (req, res, next) => {
  const { refreshToken } = req.body || {};

  if (typeof refreshToken !== 'string' || !refreshToken.trim()) {
    return sendError(res, 400, 'Validation failed', ['refreshToken is required']);
  }

  req.body.refreshToken = refreshToken.trim();
  return next();
};
