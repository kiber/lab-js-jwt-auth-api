const express = require('express');
const { register, login } = require('../controllers/auth.controller');
const validateAuthInput = require('../middleware/validateAuthInput.middleware');

const router = express.Router();

router.post('/register', validateAuthInput, register);
router.post('/login', validateAuthInput, login);

module.exports = router;
