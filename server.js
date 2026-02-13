require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/db');
const { app: appConfig } = require('./src/config/app.config');
const logger = require('./src/config/logger');

const { port } = appConfig;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(port, () => {
      logger.info('JWT Auth Service running on port %d', port);
    });
  } catch (error) {
    logger.error('Failed to start server: %s', error.message, { error });
    process.exit(1);
  }
};

startServer();
