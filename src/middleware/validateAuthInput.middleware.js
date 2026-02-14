const createValidationMiddleware = require('./validate.middleware');
const { authInputSchema } = require('../validation/auth.schemas');

module.exports = createValidationMiddleware(authInputSchema);
