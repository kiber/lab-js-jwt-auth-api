const { rateLimit } = require('../../config/app.config');
const logger = require('../../config/logger');
const MemoryRateLimitStore = require('./memoryRateLimit.store');
const MongoRateLimitStore = require('./mongoRateLimit.store');
const RedisRateLimitStore = require('./redisRateLimit.store');
const RateLimitStore = require('./rateLimit.store');

let singletonStore;

const createRateLimitStore = () => {
  let store;

  if (rateLimit.store === 'mongo') {
    logger.info('Rate limit store: mongo');
    store = new MongoRateLimitStore();
  } else if (rateLimit.store === 'redis') {
    logger.info('Rate limit store: redis');
    store = new RedisRateLimitStore({ redisUrl: rateLimit.redisUrl });
  } else {
    logger.info('Rate limit store: memory');
    store = new MemoryRateLimitStore();
  }

  if (!(store instanceof RateLimitStore)) {
    throw new Error('Configured rate limit store does not implement RateLimitStore');
  }

  return store;
};

const getRateLimitStore = () => {
  if (!singletonStore) {
    singletonStore = createRateLimitStore();
  }

  return singletonStore;
};

module.exports = {
  getRateLimitStore
};
