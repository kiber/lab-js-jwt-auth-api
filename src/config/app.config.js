const {
  parseBoolean,
  parsePositiveInteger,
  parseDurationToMs
} = require('./parsers');

const makeRateLimitPolicy = (windowEnv, limitEnv, defaults) => ({
  windowMs: parseDurationToMs(process.env[windowEnv], defaults.windowMs),
  limit: parsePositiveInteger(process.env[limitEnv], defaults.limit)
});

const appConfig = {
  app: {
    port: Number(process.env.PORT) || 3000,
    trustProxy: parseBoolean(process.env.TRUST_PROXY, false)
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173'
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info'
  },
  db: {
    mongoUri: process.env.MONGO_URI
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET,
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    accessTokenTtl: '15m',
    refreshTokenTtl: '7d',
    bcryptSaltRounds: 10
  },
  validation: {
    passwordMinLength: 8,
    passwordMaxLength: 72
  },
  rateLimit: {
    enabled: parseBoolean(process.env.RATE_LIMIT_ENABLED, true),
    store: process.env.RATE_LIMIT_STORE || 'memory',
    redisUrl: process.env.RATE_LIMIT_REDIS_URL || process.env.REDIS_URL || null,
    keyPrefix: process.env.RATE_LIMIT_KEY_PREFIX || 'jwt-auth',
    login: makeRateLimitPolicy('RATE_LIMIT_LOGIN_WINDOW', 'RATE_LIMIT_LOGIN_LIMIT', {
      windowMs: 15 * 60 * 1000,
      limit: 5
    }),
    register: makeRateLimitPolicy('RATE_LIMIT_REGISTER_WINDOW', 'RATE_LIMIT_REGISTER_LIMIT', {
      windowMs: 60 * 60 * 1000,
      limit: 5
    }),
    refresh: makeRateLimitPolicy('RATE_LIMIT_REFRESH_WINDOW', 'RATE_LIMIT_REFRESH_LIMIT', {
      windowMs: 15 * 60 * 1000,
      limit: 20
    }),
    logout: makeRateLimitPolicy('RATE_LIMIT_LOGOUT_WINDOW', 'RATE_LIMIT_LOGOUT_LIMIT', {
      windowMs: 15 * 60 * 1000,
      limit: 20
    }),
    verify: makeRateLimitPolicy('RATE_LIMIT_VERIFY_WINDOW', 'RATE_LIMIT_VERIFY_LIMIT', {
      windowMs: 15 * 60 * 1000,
      limit: 30
    })
  }
};

module.exports = appConfig;
