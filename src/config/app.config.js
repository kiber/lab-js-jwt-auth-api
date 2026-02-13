const appConfig = {
  app: {
    port: Number(process.env.PORT) || 3000
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
  }
};

module.exports = appConfig;
