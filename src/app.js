const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth.routes');
const profileRoutes = require('./routes/profile.routes');
const errorMiddleware = require('./middleware/error.middleware');
const requestLogger = require('./middleware/requestLogger.middleware');
const { app: appConfig, cors: corsConfig } = require('./config/app.config');
const { sendSuccess, sendError } = require('./utils/response');

const app = express();
if (appConfig.trustProxy) {
  app.set('trust proxy', 1);
}

app.use(express.json());
app.use(
  cors({
    origin: corsConfig.origin,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  })
);
app.use(requestLogger);

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
