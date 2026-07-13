const db = require("../config/db");
const {
  ScanCommand,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand
} = require("@aws-sdk/lib-dynamodb");

const crypto = require("crypto");

const TABLE = process.env.PRODUCT_TABLE;

// GET /api/products
const getProducts = async (req, res) => {
  try {
    const data = await db.send(
      new ScanCommand({
        TableName: TABLE
      })
    );

    res.json({
      products: data.Items || [],
      totalPages: 1,
      currentPage: 1
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/products/:id
const getProductById = async (req, res) => {
  try {

    const data = await db.send(
      new GetCommand({
        TableName: TABLE,
        Key: {
          productId: req.params.id
        }
      })
    );

    if (!data.Item) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    res.json(data.Item);

  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
};

// POST /api/products
const createProduct = async (req, res) => {

  try {

    const product = {
      productId: crypto.randomUUID(),
      name: req.body.name,
      description: req.body.description,
      price: req.body.price,
      category: req.body.category,
      stock: req.body.stock || 0,
      imageUrl: req.body.imageUrl
    };

    await db.send(
      new PutCommand({
        TableName: TABLE,
        Item: product
      })
    );

    res.status(201).json(product);

  } catch (err) {

    res.status(500).json({
      message: err.message
    });

  }

};

// PUT /api/products/:id
const updateProduct = async (req, res) => {

  try {

    await db.send(
      new UpdateCommand({
        TableName: TABLE,
        Key: {
          productId: req.params.id
        },
        UpdateExpression:
          "SET #n=:n, description=:d, price=:p, category=:c, stock=:s, imageUrl=:i",

        ExpressionAttributeNames: {
          "#n": "name"
        },

        ExpressionAttributeValues: {
          ":n": req.body.name,
          ":d": req.body.description,
          ":p": req.body.price,
          ":c": req.body.category,
          ":s": req.body.stock,
          ":i": req.body.imageUrl
        },

        ReturnValues: "ALL_NEW"
      })
    );

    res.json({
      message: "Product updated"
    });

  } catch (err) {

    res.status(500).json({
      message: err.message
    });

  }

};

// DELETE /api/products/:id
const deleteProduct = async (req, res) => {

  try {

    await db.send(
      new DeleteCommand({
        TableName: TABLE,
        Key: {
          productId: req.params.id
        }
      })
    );

    res.json({
      message: "Product removed"
    });

  } catch (err) {

    res.status(500).json({
      message: err.message
    });

  }

};

// PATCH /api/products/:id/stock
const updateStock = async (req, res) => {

  try {

    await db.send(
      new UpdateCommand({
        TableName: TABLE,
        Key: {
          productId: req.params.id
        },

        UpdateExpression:
          "SET stock=:s",

        ExpressionAttributeValues: {
          ":s": req.body.stock
        },

        ReturnValues: "ALL_NEW"
      })
    );

    res.json({
      message: "Stock updated"
    });

  } catch (err) {

    res.status(500).json({
      message: err.message
    });

  }

};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  updateStock
};