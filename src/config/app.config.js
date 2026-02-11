const appConfig = {
  app: {
    port: Number(process.env.PORT) || 3000
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
    emailRegex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    passwordMinLength: 8,
    passwordMaxLength: 72
  }
};

module.exports = appConfig;
