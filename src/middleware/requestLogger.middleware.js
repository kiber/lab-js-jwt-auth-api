const logger = require('../config/logger');

module.exports = (req, res, next) => {
  const startedAt = process.hrtime.bigint();
  let logged = false;

  const logRequest = () => {
    if (logged) {
      return;
    }

    logged = true;
    const elapsedMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
    const status = res.statusCode;
    const payload = {
      method: req.method,
      url: req.originalUrl || req.url,
      status,
      durationMs: Number(elapsedMs.toFixed(2))
    };

    if (status >= 500) {
      logger.error('HTTP request completed', payload);
      return;
    }

    if (status >= 400) {
      logger.warn('HTTP request completed', payload);
      return;
    }

    logger.info('HTTP request completed', payload);
  };

  res.on('finish', logRequest);
  res.on('close', logRequest);

  next();
};
