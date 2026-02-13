const { sendError } = require('../utils/response');
const logger = require('../config/logger');

module.exports = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  if (err && err.code === 11000 && err.keyPattern && err.keyPattern.email) {
    return sendError(res, 409, 'Email already in use');
  }

  if (err && err.name === 'ValidationError') {
    return sendError(res, 400, err.message);
  }

  const statusCode = Number.isInteger(err && err.statusCode) ? err.statusCode : 500;
  const message = statusCode >= 500 ? 'Internal server error' : (err && err.message) || 'Request failed';

  if (statusCode >= 500) {
    logger.error('Unhandled server error', {
      method: req.method,
      path: req.originalUrl,
      statusCode,
      error: err
    });
  }

  return sendError(res, statusCode, message);
};
