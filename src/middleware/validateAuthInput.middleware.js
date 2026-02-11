const { sendError } = require('../utils/response');
const { validation } = require('../config/app.config');

const normalizeEmail = (email) => email.trim().toLowerCase();

module.exports = (req, res, next) => {
  const { email, password } = req.body || {};
  const errors = [];

  if (typeof email !== 'string' || !email.trim()) {
    errors.push('email is required');
  } else if (!validation.emailRegex.test(email.trim())) {
    errors.push('email must be a valid email address');
  }

  if (typeof password !== 'string') {
    errors.push('password is required');
  } else if (password.length < validation.passwordMinLength || password.length > validation.passwordMaxLength) {
    errors.push(`password must be ${validation.passwordMinLength}-${validation.passwordMaxLength} characters long`);
  }

  if (errors.length) {
    return sendError(res, 400, 'Validation failed', errors);
  }

  req.body.email = normalizeEmail(email);
  next();
};
