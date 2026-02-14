const express = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const { sendSuccess } = require('../utils/response');

const router = express.Router();

router.get('/profile', authMiddleware, (req, res) => {
  return sendSuccess(res, 200, 'Profile fetched', { userId: req.user.userId });
});

module.exports = router;
