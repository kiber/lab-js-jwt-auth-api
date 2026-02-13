const { createLogger, format, transports } = require('winston');
const { logging } = require('./app.config');

const logLevel = logging.level;
const environment = process.env.NODE_ENV || 'development';
const isProduction = environment === 'production';

const consoleFormat = format.printf(({ timestamp, level, message, stack, ...meta }) => {
  const base = `${timestamp} [${level}] ${stack || message}`;
  const hasMeta = Object.keys(meta).length > 0;

  if (!hasMeta) {
    return base;
  }

  return `${base} ${JSON.stringify(meta)}`;
});

const transportFormat = isProduction
  ? format.combine(format.errors({ stack: true }), format.splat(), format.timestamp(), format.json())
  : format.combine(
      format.errors({ stack: true }),
      format.splat(),
      format.timestamp(),
      format.colorize({ all: true }),
      consoleFormat
    );

const logger = createLogger({
  level: logLevel,
  transports: [
    new transports.Console({
      format: transportFormat
    })
  ]
});

module.exports = logger;
