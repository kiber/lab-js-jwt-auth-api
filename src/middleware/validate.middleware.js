const { sendError } = require('../utils/response');

const mapIssuesToMessages = (issues) => {
  const messages = issues.map((issue) => issue.message);
  return [...new Set(messages)];
};

module.exports = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body || {});

  if (!result.success) {
    return sendError(res, 400, 'Validation failed', mapIssuesToMessages(result.error.issues));
  }

  req.body = {
    ...(req.body || {}),
    ...result.data
  };

  return next();
};
