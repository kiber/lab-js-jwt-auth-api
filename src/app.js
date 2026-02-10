const express = require('express');
const authRoutes = require('./routes/auth.routes');
const profileRoutes = require('./routes/profile.routes');
const errorMiddleware = require('./middleware/error.middleware');
const { sendSuccess, sendError } = require('./utils/response');

const app = express();
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/', profileRoutes);

app.get('/health', (req, res) => {
  return sendSuccess(res, 200, 'Service healthy');
});

app.use((req, res) => {
  return sendError(res, 404, 'Route not found');
});

app.use(errorMiddleware);

module.exports = app;
