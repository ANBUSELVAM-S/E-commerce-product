const express = require('express');
const router = express.Router();

// GET / - Welcome message with available routes
router.get('/', async (req, res) => {
  try {
    res.status(200).json({
      message: 'Welcome to the E-Commerce API Gateway',
      version: '1.0.0',
      availableRoutes: {
        products: '/api/products/**',
        cart: '/api/cart/**',
        orders: '/api/orders/**',
        payments: '/api/payments/**',
        health: '/health'
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /health - Health check with downstream service URLs
router.get('/health', async (req, res) => {
  try {
    res.status(200).json({
      status: 'ok',
      services: {
        products: process.env.PRODUCT_SERVICE_URL,
        cart: process.env.CART_SERVICE_URL,
        orders: process.env.ORDER_SERVICE_URL,
        payments: process.env.PAYMENT_SERVICE_URL
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
