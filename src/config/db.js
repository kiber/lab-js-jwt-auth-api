const mongoose = require('mongoose');
const { db } = require('./app.config');

const connectDB = async () => {
  try {
    await mongoose.connect(db.mongoUri);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
