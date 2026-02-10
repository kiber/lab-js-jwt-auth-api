const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 72;
const { sendError } = require('../utils/response');

const normalizeEmail = (email) => email.trim().toLowerCase();

module.exports = (req, res, next) => {
  const { email, password } = req.body || {};
  const errors = [];

  if (typeof email !== 'string' || !email.trim()) {
    errors.push('email is required');
  } else if (!EMAIL_REGEX.test(email.trim())) {
    errors.push('email must be a valid email address');
  }

  if (typeof password !== 'string') {
    errors.push('password is required');
  } else if (password.length < PASSWORD_MIN_LENGTH || password.length > PASSWORD_MAX_LENGTH) {
    errors.push(`password must be ${PASSWORD_MIN_LENGTH}-${PASSWORD_MAX_LENGTH} characters long`);
  }

  if (errors.length) {
    return sendError(res, 400, 'Validation failed', errors);
  }

  req.body.email = normalizeEmail(email);
  next();
};
