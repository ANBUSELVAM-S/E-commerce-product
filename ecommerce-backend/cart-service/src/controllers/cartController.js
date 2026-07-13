const crypto = require("crypto");
const axios = require("axios");
const dynamoDB = require("../config/db");

const {
  PutCommand,
  GetCommand,
  ScanCommand,
  UpdateCommand,
  DeleteCommand
} = require("@aws-sdk/lib-dynamodb");

const TABLE_NAME = process.env.CART_TABLE;

// ----------------------------------------
// Calculate Cart Subtotal
// ----------------------------------------

const calculateSubtotal = (items) => {
  return items.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
};

// ----------------------------------------
// Create Cart
// ----------------------------------------



const createCart = async (req, res) => {

  try {

      const { productId, quantity  = 1} = req.body;

      const productResponse = await axios.get(
          `${process.env.PRODUCT_SERVICE_URL}/api/products/${productId}`
      );

      const product = productResponse.data;

      console.log("Product:", product);
console.log("Request Body:", req.body);


const cart = {
  cartId: crypto.randomUUID(),
  items: [
    {
      productId: product.productId,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      quantity
    }
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

console.log("Cart Object:", JSON.stringify(cart, null, 2));

      await dynamoDB.send(
          new PutCommand({
              TableName: TABLE_NAME,
              Item: cart
          })
      );

      res.status(201).json(cart);

  } catch (error) {

      console.error(error);

      res.status(500).json({
          message: error.message
      });
  }
};

// ----------------------------------------
// Get All Carts
// ----------------------------------------

const getAllCarts = async (req, res) => {

  try {

    const data = await dynamoDB.send(
      new ScanCommand({
        TableName: TABLE_NAME
      })
    );

    res.status(200).json(data.Items);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: error.message
    });

  }

};

// ----------------------------------------
// Get Cart
// ----------------------------------------

const getCart = async (req, res) => {

  try {

    const data = await dynamoDB.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          cartId: req.params.cartId
        }
      })
    );

    if (!data.Item) {

      return res.status(404).json({
        message: "Cart not found"
      });

    }

    res.status(200).json({
      cartId: data.Item.cartId,
      items: data.Item.items,
      subtotal: calculateSubtotal(data.Item.items),
      createdAt: data.Item.createdAt,
      updatedAt: data.Item.updatedAt
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: error.message
    });

  }

};

// ----------------------------------------
// Add Item
// ----------------------------------------

const addItem = async (req, res) => {

  try {

    const {
      productId,
      quantity = 1
    } = req.body;

    const productResponse = await axios.get(
      `${process.env.PRODUCT_SERVICE_URL}/api/products/${productId}`
    );
    
    const product = productResponse.data;
    console.log("CartId:", req.params.cartId);
console.log("Product:", product);
console.log("Body:", req.body);

    const data = await dynamoDB.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          cartId: req.params.cartId
        }
      })
    );

    let items = [];

if (!data.Item) {

  items = [];

} else {

  items = data.Item.items || [];

}

      

    const existing = items.find(
      item => item.productId === productId
    );

    if (existing) {

      existing.quantity += Number(quantity);

    } else {

      items.push({
              productId: product.productId,
              name: product.name,
              price: product.price,
              imageUrl: product.imageUrl,
              quantity: Number(quantity)
});

    }

    await dynamoDB.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          cartId: req.params.cartId,
          items,
          createdAt: data.Item?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      })
    );

    res.status(200).json({
      cartId: req.params.cartId,
      items
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: error.message
    });

  }

};

// ----------------------------------------
// Update Item Quantity
// ----------------------------------------

const updateItemQuantity = async (req, res) => {

  try {

    const {
      productId,
      quantity
    } = req.body;

    const data = await dynamoDB.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          cartId: req.params.cartId
        }
      })
    );

    if (!data.Item) {

      return res.status(404).json({
        message: "Cart not found"
      });

    }

    let items = data.Item.items;

    const item = items.find(
      item => item.productId === productId
    );

    if (!item) {

      return res.status(404).json({
        message: "Item not found"
      });

    }

    item.quantity = Number(quantity);

    await dynamoDB.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          cartId: req.params.cartId
        },
        UpdateExpression:
"SET #items = :items, updatedAt = :updatedAt",

ExpressionAttributeNames: {
  "#items": "items"
},

ExpressionAttributeValues: {
  ":items": items,
  ":updatedAt": new Date().toISOString()
},
        ReturnValues: "ALL_NEW"
      })
    );

    res.status(200).json({
      cartId: req.params.cartId,
      items
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: error.message
    });

  }

};

// ----------------------------------------
// Update Entire Cart
// ----------------------------------------

const updateCart = async (req, res) => {

  try {

    const { items } = req.body;

    const data = await dynamoDB.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          cartId: req.params.cartId
        }
      })
    );

    if (!data.Item) {

      return res.status(404).json({
        message: "Cart not found"
      });

    }

    const updatedItems = items || data.Item.items;

    await dynamoDB.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          cartId: req.params.cartId
        },
        UpdateExpression:
"SET #items = :items, updatedAt = :updatedAt",

ExpressionAttributeNames: {
  "#items": "items"
},

ExpressionAttributeValues: {
  ":items": updatedItems,
  ":updatedAt": new Date().toISOString()
},
        ReturnValues: "ALL_NEW"
      })
    );

    res.status(200).json({
      cartId: req.params.cartId,
      items: updatedItems
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: error.message
    });

  }

};

// ----------------------------------------
// Remove Item
// ----------------------------------------

const removeItem = async (req, res) => {

  try {

    const data = await dynamoDB.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          cartId: req.params.cartId
        }
      })
    );

    if (!data.Item) {

      return res.status(404).json({
        message: "Cart not found"
      });

    }

    const items = data.Item.items.filter(
      item => item.productId !== req.params.productId
    );

    await dynamoDB.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          cartId: req.params.cartId
        },
        UpdateExpression:
"SET #items = :items, updatedAt = :updatedAt",

ExpressionAttributeNames: {
  "#items": "items"
},

ExpressionAttributeValues: {
  ":items": items,
  ":updatedAt": new Date().toISOString()
},
        ReturnValues: "ALL_NEW"
      })
    );

    res.status(200).json({
      cartId: req.params.cartId,
      items
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: error.message
    });

  }

};

// ----------------------------------------
// Clear Cart
// ----------------------------------------

const clearCart = async (req, res) => {

  try {

    const data = await dynamoDB.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          cartId: req.params.cartId
        }
      })
    );

    if (!data.Item) {

      return res.status(404).json({
        message: "Cart not found"
      });

    }

    await dynamoDB.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          cartId: req.params.cartId
        },
        UpdateExpression:
"SET #items = :items, updatedAt = :updatedAt",

ExpressionAttributeNames: {
  "#items": "items"
},

ExpressionAttributeValues: {
  ":items": [],
  ":updatedAt": new Date().toISOString()
},
        ReturnValues: "ALL_NEW"
      })
    );

    res.status(200).json({
      cartId: req.params.cartId,
      items: []
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: error.message
    });

  }

};

// ----------------------------------------
// Delete Cart
// ----------------------------------------

const deleteCart = async (req, res) => {

  try {

    const data = await dynamoDB.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          cartId: req.params.cartId
        }
      })
    );

    if (!data.Item) {

      return res.status(404).json({
        message: "Cart not found"
      });

    }

    await dynamoDB.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: {
          cartId: req.params.cartId
        }
      })
    );

    res.status(200).json({
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

// ----------------------------------------
// Cart Summary
// ----------------------------------------

const getCartSummary = async (req, res) => {

  try {

    const data = await dynamoDB.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          cartId: req.params.cartId
        }
      })
    );

    if (!data.Item) {

      return res.status(404).json({
        message: "Cart not found"
      });

    }

    const items = data.Item.items || [];

    res.status(200).json({

      cartId: data.Item.cartId,

      totalItems: items.reduce(
        (total, item) => total + item.quantity,
        0
      ),

      subtotal: calculateSubtotal(items),

      items

    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: error.message
    });

  }

};

// ----------------------------------------
// Export Controllers
// ----------------------------------------

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