const express = require('express');
const { register, login, refresh, logout, verify } = require('../controllers/auth.controller');
const validateAuthInput = require('../middleware/validateAuthInput.middleware');
const validateRefreshTokenInput = require('../middleware/validateRefreshTokenInput.middleware');
const { createRateLimitMiddleware, keyGenerators } = require('../middleware/rateLimit.middleware');
const { rateLimit } = require('../config/app.config');

const router = express.Router();

const registerRateLimit = createRateLimitMiddleware({
  scope: 'auth:register',
  limit: rateLimit.register.limit,
  windowMs: rateLimit.register.windowMs,
  keyGenerator: keyGenerators.ip
});

const loginRateLimit = createRateLimitMiddleware({
  scope: 'auth:login',
  limit: rateLimit.login.limit,
  windowMs: rateLimit.login.windowMs,
  keyGenerator: keyGenerators.ipAndEmail
});

const refreshRateLimit = createRateLimitMiddleware({
  scope: 'auth:refresh',
  limit: rateLimit.refresh.limit,
  windowMs: rateLimit.refresh.windowMs,
  keyGenerator: keyGenerators.ip
});

const logoutRateLimit = createRateLimitMiddleware({
  scope: 'auth:logout',
  limit: rateLimit.logout.limit,
  windowMs: rateLimit.logout.windowMs,
  keyGenerator: keyGenerators.ip
});

const verifyRateLimit = createRateLimitMiddleware({
  scope: 'auth:verify',
  limit: rateLimit.verify.limit,
  windowMs: rateLimit.verify.windowMs,
  keyGenerator: keyGenerators.ip
});

router.post('/register', registerRateLimit, validateAuthInput, register);
router.post('/login', loginRateLimit, validateAuthInput, login);
router.post('/refresh', refreshRateLimit, validateRefreshTokenInput, refresh);
router.post('/logout', logoutRateLimit, validateRefreshTokenInput, logout);
router.post('/verify', verifyRateLimit, verify);

module.exports = router;
