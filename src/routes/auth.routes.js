const express = require('express');
const { register, login, refresh, logout, verify } = require('../controllers/auth.controller');
const validateAuthInput = require('../middleware/validateAuthInput.middleware');
const validateRefreshTokenInput = require('../middleware/validateRefreshTokenInput.middleware');

const router = express.Router();

router.post('/register', validateAuthInput, register);
router.post('/login', validateAuthInput, login);
router.post('/refresh', validateRefreshTokenInput, refresh);
router.post('/logout', validateRefreshTokenInput, logout);
router.post('/verify', verify);

module.exports = router;
