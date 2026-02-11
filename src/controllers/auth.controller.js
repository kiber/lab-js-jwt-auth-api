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

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) return sendError(res, 401, 'Invalid credentials');

  const token = signAccessToken(user._id);
  const refreshToken = signRefreshToken(user._id);
  user.refreshTokenHash = hashToken(refreshToken);
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
