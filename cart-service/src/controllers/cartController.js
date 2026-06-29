const Cart = require('../models/Cart');
const { v4: uuidv4 } = require('uuid');

// Calculate subtotal
const calculateSubtotal = (items) => {
  return items.reduce((total, item) => total + item.price * item.quantity, 0);
};

// Create Cart
const createCart = async (req, res) => {
  try {
    const cart = new Cart({
      cartId: uuidv4(),
      items: []
    });

    const savedCart = await cart.save();

    res.status(201).json(savedCart);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// Get All Carts
const getAllCarts = async (req, res) => {
  try {
    const carts = await Cart.find();
    res.status(200).json(carts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// Get Cart
const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({
      cartId: req.params.cartId
    });

    if (!cart) {
      return res.status(404).json({
        message: "Cart not found"
      });
    }

    res.status(200).json({
      cartId: cart.cartId,
      items: cart.items,
      subtotal: calculateSubtotal(cart.items),
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: error.message
    });
  }
};

// Add Item
const addItem = async (req, res) => {
  try {

    const {
      productId,
      name,
      price,
      imageUrl,
      quantity = 1
    } = req.body;

    const cart = await Cart.findOne({
      cartId: req.params.cartId
    });

    if (!cart) {
      return res.status(404).json({
        message: "Cart not found"
      });
    }

    const existing = cart.items.find(
      item => item.productId === productId
    );

    if (existing) {
      existing.quantity += Number(quantity);
    } else {
      cart.items.push({
        productId,
        name,
        price,
        imageUrl,
        quantity
      });
    }

    await cart.save();

    res.status(200).json(cart);

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: error.message
    });
  }
};

// Update Item Quantity
const updateItemQuantity = async (req, res) => {

  try {

    const { productId, quantity } = req.body;

    const cart = await Cart.findOne({
      cartId: req.params.cartId
    });

    if (!cart) {
      return res.status(404).json({
        message: "Cart not found"
      });
    }

    const item = cart.items.find(
      item => item.productId === productId
    );

    if (!item) {
      return res.status(404).json({
        message: "Item not found"
      });
    }

    item.quantity = Number(quantity);

    cart.markModified("items");

    await cart.save();

    res.status(200).json(cart);

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: error.message
    });
  }
};

// Update Entire Cart
const updateCart = async (req, res) => {

  try {

    const cart = await Cart.findOneAndUpdate(
      {
        cartId: req.params.cartId
      },
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!cart) {
      return res.status(404).json({
        message: "Cart not found"
      });
    }

    res.status(200).json(cart);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: error.message
    });

  }

};

// Remove Item
const removeItem = async (req, res) => {

  try {

    const cart = await Cart.findOne({
      cartId: req.params.cartId
    });

    if (!cart) {
      return res.status(404).json({
        message: "Cart not found"
      });
    }

    cart.items = cart.items.filter(
      item => item.productId !== req.params.productId
    );

    await cart.save();

    res.status(200).json(cart);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: error.message
    });

  }

};

// Clear Cart
const clearCart = async (req, res) => {

  try {

    const cart = await Cart.findOne({
      cartId: req.params.cartId
    });

    if (!cart) {
      return res.status(404).json({
        message: "Cart not found"
      });
    }

    cart.items = [];

    await cart.save();

    res.status(200).json(cart);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: error.message
    });

  }

};

// Delete Cart
const deleteCart = async (req, res) => {

  try {

    const cart = await Cart.findOneAndDelete({
      cartId: req.params.cartId
    });

    if (!cart) {
      return res.status(404).json({
        message: "Cart not found"
      });
    }

    res.json({
      success: true,
      message: "Cart deleted successfully"
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: error.message
    });

  }

};

// Cart Summary
const getCartSummary = async (req, res) => {

  try {

    const cart = await Cart.findOne({
      cartId: req.params.cartId
    });

    if (!cart) {
      return res.status(404).json({
        message: "Cart not found"
      });
    }

    res.json({
      cartId: cart.cartId,
      totalItems: cart.items.reduce(
        (total, item) => total + item.quantity,
        0
      ),
      subtotal: calculateSubtotal(cart.items),
      items: cart.items
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: error.message
    });

  }

};

module.exports = {
  createCart,
  getAllCarts,
  getCart,
  addItem,
  updateItemQuantity,
  updateCart,
  removeItem,
  clearCart,
  deleteCart,
  getCartSummary
};