const Order = require('../models/Order');
const axios = require('axios');

// Helper to get service URLs
const getCartServiceUrl = () => process.env.CART_SERVICE_URL || 'http://localhost:5002';
const getProductServiceUrl = () => process.env.PRODUCT_SERVICE_URL || 'http://localhost:5001';

// POST /api/orders
const createOrder = async (req, res) => {
  try {
    const { cartId, shippingAddress } = req.body;

    if (!cartId || !shippingAddress) {
      return res.status(400).json({ message: 'cartId and shippingAddress are required' });
    }

    // 1. Call GET http://localhost:5002/api/cart/:cartId/summary
    let cartResponse;
    try {
      cartResponse = await axios.get(`${getCartServiceUrl()}/api/cart/${cartId}/summary`);
    } catch (err) {
      if (err.response && err.response.status === 404) {
         return res.status(404).json({ message: 'Cart not found' });
      }
      throw new Error(`Failed to fetch cart: ${err.message}`);
    }

    const cartData = cartResponse.data;

    // 2. Validate cart is not empty
    if (!cartData.items || cartData.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // 3. Calculate totalAmount = subtotal + shippingCharge
    const subtotal = cartData.subtotal;
    const shippingCharge = 50;
    const totalAmount = subtotal + shippingCharge;

    // 4. Create Order document
    const order = new Order({
      cartId,
      items: cartData.items,
      subtotal,
      shippingCharge,
      totalAmount,
      shippingAddress,
      status: 'pending',
      paymentStatus: 'unpaid'
    });

    const savedOrder = await order.save();

    // 5. Call PATCH http://localhost:5001/api/products/:id/stock for each item
    const productPromises = cartData.items.map(item => {
      return axios.patch(`${getProductServiceUrl()}/api/products/${item.productId}/stock`, {
        decrement: item.quantity
      });
    });

    try {
      await Promise.all(productPromises);
    } catch (err) {
      console.error('Failed to update product stock:', err.message);
      // Log the error, but order is already saved.
    }

    // 6. Call DELETE http://localhost:5002/api/cart/:cartId/clear
    try {
       await axios.delete(`${getCartServiceUrl()}/api/cart/${cartId}/clear`);
    } catch (err) {
       console.error('Failed to clear cart:', err.message);
    }

    // 7. Return the created order
    res.status(201).json(savedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/orders
const getOrders = async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};
    if (status) {
      query.status = status;
    }

    const orders = await Order.find(query).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/orders/:id
const getOrderById = async (req, res) => {
  try {
    // Check if the id is a valid mongo ObjectId or an orderId string
    let query = { $or: [{ _id: req.params.id }, { orderId: req.params.id }] };
    
    // Mongoose will throw cast error if we pass an invalid ObjectId, handle gracefully
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
        query = { orderId: req.params.id };
    }

    const order = await Order.findOne(query);

    if (order) {
      res.json(order);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/orders/:id
const deleteOrder = async (req, res) => {
  try {
     let query = { $or: [{ _id: req.params.id }, { orderId: req.params.id }] };
     if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
         query = { orderId: req.params.id };
     }

    const order = await Order.findOneAndDelete(query);
    if (order) {
      res.json({ message: 'Order deleted successfully' });
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/orders/:id/cancel
const cancelOrder = async (req, res) => {
  try {
    let query = { $or: [{ _id: req.params.id }, { orderId: req.params.id }] };
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
        query = { orderId: req.params.id };
    }

    const order = await Order.findOne(query);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ message: `Cannot cancel order with status: ${order.status}` });
    }

    order.status = 'cancelled';
    const updatedOrder = await order.save();

    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/orders/:orderId/pay
const payOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.orderId });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.paymentStatus = 'paid';
    order.status = 'confirmed';
    
    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  deleteOrder,
  cancelOrder,
  payOrder
};
