const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  refreshTokenHash: { type: String, default: null }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
