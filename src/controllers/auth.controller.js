const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendSuccess, sendError } = require('../utils/response');
const { auth } = require('../config/app.config');

const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

const signAccessToken = (userId) => {
  return jwt.sign({ userId }, auth.jwtSecret, { expiresIn: auth.accessTokenTtl });
};

const signRefreshToken = (userId) => {
  return jwt.sign({ userId }, auth.jwtRefreshSecret, { expiresIn: auth.refreshTokenTtl });
};

exports.register = async (req, res) => {
  const { email, password } = req.body;

  const hashedPassword = await bcrypt.hash(password, auth.bcryptSaltRounds);
  await User.create({ email, password: hashedPassword });

  return sendSuccess(res, 201, 'User registered');
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return sendError(res, 401, 'Invalid credentials');
  const now = new Date();
  const lockoutConfig = auth.accountLockout;

  if (lockoutConfig.enabled && user.lockUntil && user.lockUntil > now) {
    return sendError(res, 423, 'Account temporarily locked due to failed login attempts');
  }

  if (lockoutConfig.enabled && user.lockUntil && user.lockUntil <= now) {
    user.failedLoginAttempts = 0;
    user.lockUntil = null;
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    if (lockoutConfig.enabled) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      if (user.failedLoginAttempts >= lockoutConfig.maxFailedAttempts) {
        user.lockUntil = new Date(Date.now() + lockoutConfig.lockDurationMs);
        await user.save();
        return sendError(res, 423, 'Account temporarily locked due to failed login attempts');
      }

      await user.save();
    }

    return sendError(res, 401, 'Invalid credentials');
  }

  const token = signAccessToken(user._id);
  const refreshToken = signRefreshToken(user._id);
  user.refreshTokenHash = hashToken(refreshToken);
  user.failedLoginAttempts = 0;
  user.lockUntil = null;
  await user.save();

  return sendSuccess(res, 200, 'Login successful', { token, refreshToken });
};

exports.refresh = async (req, res) => {
  const { refreshToken } = req.body;

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, auth.jwtRefreshSecret);
  } catch {
    return sendError(res, 401, 'Invalid refresh token');
  }

  const user = await User.findById(decoded.userId);
  if (!user || !user.refreshTokenHash) {
    return sendError(res, 401, 'Invalid refresh token');
  }

  const incomingTokenHash = hashToken(refreshToken);
  if (user.refreshTokenHash !== incomingTokenHash) {
    return sendError(res, 401, 'Invalid refresh token');
  }

  const token = signAccessToken(user._id);
  const newRefreshToken = signRefreshToken(user._id);
  user.refreshTokenHash = hashToken(newRefreshToken);
  await user.save();

  return sendSuccess(res, 200, 'Token refreshed', {
    token,
    refreshToken: newRefreshToken
  });
};

exports.logout = async (req, res) => {
  const { refreshToken } = req.body;

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, auth.jwtRefreshSecret);
  } catch {
    return sendError(res, 401, 'Invalid refresh token');
  }

  const user = await User.findById(decoded.userId);
  if (!user || !user.refreshTokenHash) {
    return sendError(res, 401, 'Invalid refresh token');
  }

  const incomingTokenHash = hashToken(refreshToken);
  if (user.refreshTokenHash !== incomingTokenHash) {
    return sendError(res, 401, 'Invalid refresh token');
  }

  user.refreshTokenHash = null;
  await user.save();

  return sendSuccess(res, 200, 'Logged out successfully');
};

exports.verify = async (req, res) => {
  const authHeader = req.headers?.authorization;
  if (!authHeader) return sendError(res, 401, 'Authorization header is required');

  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return sendError(res, 401, 'Authorization header must use Bearer token');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, auth.jwtSecret);
  } catch {
    return sendError(res, 401, 'Invalid token');
  }

  return sendSuccess(res, 200, 'Token is valid', {
    valid: true,
    userId: String(decoded.userId)
  });
};
