const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const serverless = require("serverless-http");

const cartRoutes = require('./routes/cartRoutes');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

process.env.PORT = process.env.CART_PORT || 5002;

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/api/cart', cartRoutes);

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'cart-service'
  });
});

// Test Route
app.get('/test', (req, res) => {
  res.send('Server Working');
});

const PORT = process.env.PORT || 5002;

// Run locally only
if (!process.env.AWS_LAMBDA_FUNCTION_NAME) {
  app.listen(PORT, () => {
    console.log(`Cart service running on port ${PORT}`);
  });
}

module.exports = app;
module.exports.handler = serverless(app);