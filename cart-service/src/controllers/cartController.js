const Cart = require('../models/Cart');
const { v4: uuidv4 } = require('uuid');

// Calculate subtotal helper
const calculateSubtotal = (items) => {
  return items.reduce((total, item) => total + (item.price * item.quantity), 0);
};

// POST /api/cart
const createCart = async (req, res) => {
  try {
    const cartId = uuidv4();
    const cart = new Cart({
      cartId,
      items: []
    });

    const savedCart = await cart.save();
    res.status(201).json({
      cartId: savedCart.cartId,
      items: savedCart.items,
      createdAt: savedCart.createdAt
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/cart/:cartId
const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ cartId: req.params.cartId });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const subtotal = calculateSubtotal(cart.items);
    
    // Return cart with subtotal
    const cartData = cart.toObject();
    cartData.subtotal = subtotal;

    res.json(cartData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/cart/:cartId/add
const addItem = async (req, res) => {
  try {
    const { productId, name, price, imageUrl, quantity = 1 } = req.body;
    
    if (!productId || !name || price === undefined) {
        return res.status(400).json({ message: 'productId, name, and price are required' });
    }

    let cart = await Cart.findOne({ cartId: req.params.cartId });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const itemIndex = cart.items.findIndex(item => item.productId === productId);

    if (itemIndex > -1) {
      // Product exists, increase quantity
      cart.items[itemIndex].quantity += quantity;
    } else {
      // New product, push to items
      cart.items.push({ productId, name, price, imageUrl, quantity });
    }

    const updatedCart = await cart.save();
    const cartData = updatedCart.toObject();
    cartData.subtotal = calculateSubtotal(cartData.items);
    
    res.json(cartData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/cart/:cartId/update
const updateItemQuantity = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    
    if (!productId || quantity === undefined) {
         return res.status(400).json({ message: 'productId and quantity are required' });
    }

    let cart = await Cart.findOne({ cartId: req.params.cartId });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const itemIndex = cart.items.findIndex(item => item.productId === productId);

    if (itemIndex > -1) {
      if (quantity <= 0) {
        // Remove item if quantity is 0 or less
        cart.items.splice(itemIndex, 1);
      } else {
        // Update quantity
        cart.items[itemIndex].quantity = quantity;
      }
      
      const updatedCart = await cart.save();
      const cartData = updatedCart.toObject();
      cartData.subtotal = calculateSubtotal(cartData.items);
      res.json(cartData);
    } else {
      res.status(404).json({ message: 'Item not found in cart' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/cart/:cartId/remove/:productId
const removeItem = async (req, res) => {
  try {
    let cart = await Cart.findOne({ cartId: req.params.cartId });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.items = cart.items.filter(item => item.productId !== req.params.productId);

    const updatedCart = await cart.save();
    const cartData = updatedCart.toObject();
    cartData.subtotal = calculateSubtotal(cartData.items);
    res.json(cartData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/cart/:cartId/clear
const clearCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ cartId: req.params.cartId });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.items = [];
    const updatedCart = await cart.save();
    
    res.json(updatedCart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/cart/:cartId/summary
const getCartSummary = async (req, res) => {
  try {
    const cart = await Cart.findOne({ cartId: req.params.cartId });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const subtotal = calculateSubtotal(cart.items);
    const totalItems = cart.items.reduce((total, item) => total + item.quantity, 0);

    res.json({
      cartId: cart.cartId,
      items: cart.items,
      totalItems,
      subtotal
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createCart,
  getCart,
  addItem,
  updateItemQuantity,
  removeItem,
  clearCart,
  getCartSummary
};
