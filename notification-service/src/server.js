const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const serverless = require("serverless-http");

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
process.env.PORT = process.env.NOTIFICATION_PORT || 5006;
process.env.MONGO_URI = process.env.NOTIFICATION_MONGO_URI;

const connectDB = require('./config/db');
const notificationRoutes = require('./routes/notificationRoutes');

connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/api/notifications', notificationRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'notification-service' });
});

const PORT = process.env.PORT;

// app.listen(PORT, () => {
//   console.log(`Notification service running on port ${PORT}`);
// });

// module.exports = app;

module.exports.handler = serverless(app);