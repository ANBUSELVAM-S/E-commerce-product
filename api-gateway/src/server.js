const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

process.env.PORT = process.env.GATEWAY_PORT || 5000;

const app = express();

// 1. Uses cors() to allow all origins
app.use(cors());

// 2. Uses morgan('dev') for request logging
app.use(morgan('dev'));

// Note: Do NOT use express.json() before http-proxy-middleware
// It can interfere with proxied POST/PUT body parsing on the target microservices.

// 3. Proxies each route using createProxyMiddleware
const proxyOptions = {
  changeOrigin: true,
  logLevel: 'debug'
};

app.use('/api/products', createProxyMiddleware({
  target: 'http://localhost:5001',
  ...proxyOptions
}));

app.use('/api/cart', createProxyMiddleware({
  target: 'http://localhost:5002',
  ...proxyOptions
}));

app.use('/api/orders', createProxyMiddleware({
  target: 'http://localhost:5003',
  ...proxyOptions
}));

app.use('/api/payments', createProxyMiddleware({
  target: 'http://localhost:5004',
  ...proxyOptions
}));

app.use('/api/search', createProxyMiddleware({
  target: 'http://localhost:5005',
  ...proxyOptions
}));

app.use('/api/notifications', createProxyMiddleware({
  target: 'http://localhost:5006',
  ...proxyOptions
}));

app.use('/api/inventory', createProxyMiddleware({
  target: 'http://localhost:5007',
  ...proxyOptions
}));

// 4. Health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'API Gateway Running',
    timestamp: new Date(),
    services: {
      products: 'http://localhost:5001',
      cart: 'http://localhost:5002',
      orders: 'http://localhost:5003',
      payments: 'http://localhost:5004',
      search: 'http://localhost:5005',
      notifications: 'http://localhost:5006',
      inventory: 'http://localhost:5007'
    }
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`API Gateway is running on port ${PORT}`);
});
