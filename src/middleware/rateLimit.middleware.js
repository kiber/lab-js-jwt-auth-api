const { sendError } = require('../utils/response');
const { rateLimit } = require('../config/app.config');
const logger = require('../config/logger');
const { getRateLimitStore } = require('../services/rateLimit');

const defaultKeyGenerator = (req) => req.ip || req.socket?.remoteAddress || 'unknown';

const ipAndEmailKeyGenerator = (req) => {
  const ip = defaultKeyGenerator(req);
  const email = String(req.body?.email || '').trim().toLowerCase();
  return email ? `${ip}:${email}` : ip;
};

const setRateLimitHeaders = (res, { limit, remaining, resetAt }) => {
  const resetAtSeconds = Math.ceil(resetAt.getTime() / 1000);
  res.setHeader('X-RateLimit-Limit', String(limit));
  res.setHeader('X-RateLimit-Remaining', String(Math.max(0, remaining)));
  res.setHeader('X-RateLimit-Reset', String(resetAtSeconds));
};

const createRateLimitMiddleware = ({
  scope,
  limit,
  windowMs,
  keyGenerator = defaultKeyGenerator
}) => {
  return async (req, res, next) => {
    if (!rateLimit.enabled) return next();

    const baseKey = keyGenerator(req);
    const key = `${rateLimit.keyPrefix}:${scope}:${baseKey}`;
    const store = getRateLimitStore();
    const { count, resetAt } = await store.increment(key, windowMs);
    const remaining = limit - count;

    setRateLimitHeaders(res, { limit, remaining, resetAt });

    if (count <= limit) return next();

    const retryAfterSeconds = Math.max(1, Math.ceil((resetAt.getTime() - Date.now()) / 1000));
    res.setHeader('Retry-After', String(retryAfterSeconds));

    logger.warn('Rate limit exceeded', {
      scope,
      key,
      ip: req.ip,
      count,
      limit
    });

    return sendError(res, 429, 'Too many requests', [
      `Try again in ${retryAfterSeconds} seconds`
    ]);
  };
};

module.exports = {
  createRateLimitMiddleware,
  keyGenerators: {
    ip: defaultKeyGenerator,
    ipAndEmail: ipAndEmailKeyGenerator
  }
};
