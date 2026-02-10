const express = require('express');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/profile', authMiddleware, (req, res) => {
  res.json({ userId: req.user.userId });
});

module.exports = router;
