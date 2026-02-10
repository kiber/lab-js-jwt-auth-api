const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { sendSuccess, sendError } = require('../utils/response');

exports.register = async (req, res) => {
  const { email, password } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);
  await User.create({ email, password: hashedPassword });

  return sendSuccess(res, 201, 'User registered');
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return sendError(res, 401, 'Invalid credentials');

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) return sendError(res, 401, 'Invalid credentials');

  const token = jwt.sign(
    { userId: user._id },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );

  return sendSuccess(res, 200, 'Login successful', { token });
};
