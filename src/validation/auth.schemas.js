const { z } = require('zod');
const { validation } = require('../config/app.config');

const passwordLengthMessage = `password must be ${validation.passwordMinLength}-${validation.passwordMaxLength} characters long`;

const emailField = z
  .string({
    required_error: 'email is required',
    invalid_type_error: 'email is required'
  })
  .trim()
  .min(1, 'email is required')
  .email('email must be a valid email address')
  .transform((value) => value.toLowerCase());

const passwordField = z
  .string({
    required_error: 'password is required',
    invalid_type_error: 'password is required'
  })
  .min(validation.passwordMinLength, passwordLengthMessage)
  .max(validation.passwordMaxLength, passwordLengthMessage);

const refreshTokenField = z
  .string({
    required_error: 'refreshToken is required',
    invalid_type_error: 'refreshToken is required'
  })
  .trim()
  .min(1, 'refreshToken is required');

const authInputSchema = z.object({
  email: emailField,
  password: passwordField
});

const refreshTokenSchema = z.object({
  refreshToken: refreshTokenField
});

module.exports = {
  authInputSchema,
  refreshTokenSchema
};
