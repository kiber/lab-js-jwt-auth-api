const express = require('express');
const authRoutes = require('../auth.routes');
const profileRoutes = require('../profile.routes');
const { sendSuccess } = require('../../utils/response');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/', profileRoutes);

router.get('/health', (req, res) => {
  return sendSuccess(res, 200, 'Service healthy');
});

module.exports = router;
