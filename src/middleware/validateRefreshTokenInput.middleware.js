const createValidationMiddleware = require('./validate.middleware');
const { refreshTokenSchema } = require('../validation/auth.schemas');

module.exports = createValidationMiddleware(refreshTokenSchema);
