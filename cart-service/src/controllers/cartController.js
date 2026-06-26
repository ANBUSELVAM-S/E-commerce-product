const Cart = require('../models/Cart');
const { v4: uuidv4 } = require('uuid');

// Calculate subtotal
const calculateSubtotal = (items) => {
return items.reduce((total, item) => total + (item.price * item.quantity), 0);
};

// Create Cart
const createCart = async (req, res) => {
try {
const cart = new Cart({
cartId: uuidv4(),
items: []
});

```
const savedCart = await cart.save();

res.status(201).json(savedCart);
```

} catch (error) {
res.status(500).json({ message: error.message });
}
};

// Get All Carts
const getAllCarts = async (req, res) => {
try {
const carts = await Cart.find();
res.status(200).json(carts);
} catch (error) {
res.status(500).json({ message: error.message });
}
};

// Get Cart By CartId
const getCart = async (req, res) => {
try {
const cart = await Cart.findOne({
cartId: req.params.cartId
});

```
if (!cart) {
  return res.status(404).json({
    message: 'Cart not found'
  });
}

const cartData = cart.toObject();
cartData.subtotal = calculateSubtotal(cart.items);

res.status(200).json(cartData);
```

} catch (error) {
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

```
let cart = await Cart.findOne({
  cartId: req.params.cartId
});

if (!cart) {
  return res.status(404).json({
    message: 'Cart not found'
  });
}

const itemIndex = cart.items.findIndex(
  item => item.productId === productId
);

if (itemIndex > -1) {
  cart.items[itemIndex].quantity += quantity;
} else {
  cart.items.push({
    productId,
    name,
    price,
    imageUrl,
    quantity
  });
}

const updatedCart = await cart.save();

res.status(200).json(updatedCart);
```

} catch (error) {
res.status(500).json({
message: error.message
});
}
};

// Update Quantity
const updateItemQuantity = async (req, res) => {
try {
const { productId, quantity } = req.body;

```
const cart = await Cart.findOne({
  cartId: req.params.cartId
});

if (!cart) {
  return res.status(404).json({
    message: 'Cart not found'
  });
}

const item = cart.items.find(
  item => item.productId === productId
);

if (!item) {
  return res.status(404).json({
    message: 'Item not found'
  });
}

item.quantity = quantity;

const updatedCart = await cart.save();

res.status(200).json(updatedCart);
```

} catch (error) {
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

```
if (!cart) {
  return res.status(404).json({
    message: 'Cart not found'
  });
}

res.status(200).json(cart);
```

} catch (error) {
res.status(500).json({
message: error.message
});
}
};

// Remove Product
const removeItem = async (req, res) => {
try {
const cart = await Cart.findOne({
cartId: req.params.cartId
});

```
if (!cart) {
  return res.status(404).json({
    message: 'Cart not found'
  });
}

cart.items = cart.items.filter(
  item => item.productId !== req.params.productId
);

const updatedCart = await cart.save();

res.status(200).json(updatedCart);
```

} catch (error) {
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

```
if (!cart) {
  return res.status(404).json({
    message: 'Cart not found'
  });
}

cart.items = [];

const updatedCart = await cart.save();

res.status(200).json(updatedCart);
```

} catch (error) {
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

```
if (!cart) {
  return res.status(404).json({
    message: 'Cart not found'
  });
}

res.status(200).json({
  success: true,
  message: 'Cart deleted successfully'
});
```

} catch (error) {
res.status(500).json({
message: error.message
});
}
};

// Summary
const getCartSummary = async (req, res) => {
try {
const cart = await Cart.findOne({
cartId: req.params.cartId
});

```
if (!cart) {
  return res.status(404).json({
    message: 'Cart not found'
  });
}

res.status(200).json({
  cartId: cart.cartId,
  totalItems: cart.items.reduce(
    (total, item) => total + item.quantity,
    0
  ),
  subtotal: calculateSubtotal(cart.items),
  items: cart.items
});
```

} catch (error) {
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
