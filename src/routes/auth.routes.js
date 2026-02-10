const express = require('express');
const { register, login, refresh } = require('../controllers/auth.controller');
const validateAuthInput = require('../middleware/validateAuthInput.middleware');
const validateRefreshTokenInput = require('../middleware/validateRefreshTokenInput.middleware');

const router = express.Router();

router.post('/register', validateAuthInput, register);
router.post('/login', validateAuthInput, login);
router.post('/refresh', validateRefreshTokenInput, refresh);

module.exports = router;
