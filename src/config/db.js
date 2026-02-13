const mongoose = require('mongoose');
const { db } = require('./app.config');
const logger = require('./logger');

const connectDB = async () => {
  try {
    await mongoose.connect(db.mongoUri);
    logger.info('MongoDB connected (JWT Service)');
  } catch (error) {
    logger.error('MongoDB connection failed: %s', error.message, { error });
    process.exit(1);
  }
};

module.exports = connectDB;
