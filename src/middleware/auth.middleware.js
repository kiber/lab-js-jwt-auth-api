const jwt = require('jsonwebtoken');
const { sendError } = require('../utils/response');

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return sendError(res, 401, 'Authorization header is required');

  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return sendError(res, 401, 'Authorization header must use Bearer token');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    return next();
  } catch {
    return sendError(res, 403, 'Invalid or expired token');
  }
};
