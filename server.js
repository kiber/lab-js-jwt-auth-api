require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/db');
const { app: appConfig } = require('./src/config/app.config');

const { port } = appConfig;

connectDB();

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
