const db = require("../config/db");
const axios = require("axios");
const crypto = require("crypto");

const {
  ScanCommand,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand
} = require("@aws-sdk/lib-dynamodb");

const TABLE = process.env.PRODUCT_TABLE;

// ----------------------------------------------------
// Inventory Service URL
// ----------------------------------------------------
const getInventoryServiceUrl = () => {
  const url = process.env.INVENTORY_SERVICE_URL;

  if (!url) {
    throw new Error(
      "INVENTORY_SERVICE_URL is not configured"
    );
  }

  // Remove trailing slash
  return url.replace(/\/+$/, "");
};

// ----------------------------------------------------
// GET ALL PRODUCTS
// GET /api/products
// ----------------------------------------------------
const getProducts = async (req, res) => {
  try {
    const data = await db.send(
      new ScanCommand({
        TableName: TABLE
      })
    );

    return res.status(200).json({
      products: data.Items || [],
      totalPages: 1,
      currentPage: 1
    });
  } catch (error) {
    console.error("Get products error:", error);

    return res.status(500).json({
      message: error.message
    });
  }
};

// ----------------------------------------------------
// GET PRODUCT BY ID
// GET /api/products/:id
// ----------------------------------------------------
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

    return res.status(200).json(data.Item);
  } catch (error) {
    console.error("Get product error:", error);

    return res.status(500).json({
      message: error.message
    });
  }
};

// ----------------------------------------------------
// CREATE PRODUCT AND INVENTORY
// POST /api/products
// ----------------------------------------------------
const createProduct = async (req, res) => {
  let createdProductId = null;
  let productCreated = false;

  try {
    const {
      name,
      description,
      price,
      category,
      stock = 0,
      imageUrl,
      lowStockThreshold = 10
    } = req.body;

    // ------------------------------------------------
    // Validate required fields
    // ------------------------------------------------
    if (!name || name.trim() === "") {
      return res.status(400).json({
        message: "Product name is required"
      });
    }

    if (
      price === undefined ||
      price === null ||
      price === ""
    ) {
      return res.status(400).json({
        message: "Product price is required"
      });
    }

    

    

    // ------------------------------------------------
    // Convert number values
    // ------------------------------------------------
    const productPrice = Number(price);
    const initialStock = Number(stock);
    const threshold = Number(lowStockThreshold);

    if (
      Number.isNaN(productPrice) ||
      productPrice < 0
    ) {
      return res.status(400).json({
        message:
          "Product price must be a valid non-negative number"
      });
    }

    if (
      Number.isNaN(initialStock) ||
      initialStock < 0
    ) {
      return res.status(400).json({
        message:
          "Stock must be a valid non-negative number"
      });
    }

    if (
      Number.isNaN(threshold) ||
      threshold < 0
    ) {
      return res.status(400).json({
        message:
          "Low stock threshold must be a valid non-negative number"
      });
    }

    const inventoryServiceUrl =
      getInventoryServiceUrl();

    createdProductId = crypto.randomUUID();

    const currentTime = new Date().toISOString();

    // ------------------------------------------------
    // Product data
    // ------------------------------------------------
    const product = {
      productId: createdProductId,
      name: name.trim(),
      description: description || "",
      price: productPrice,
      category: category || "",
      stock: initialStock,
      imageUrl: imageUrl || "",
      createdAt: currentTime,
      updatedAt: currentTime
    };

    // ------------------------------------------------
    // Step 1: Save Product
    // ------------------------------------------------
    await db.send(
      new PutCommand({
        TableName: TABLE,
        Item: product,
        ConditionExpression:
          "attribute_not_exists(productId)"
      })
    );

    productCreated = true;

    // ------------------------------------------------
    // Inventory request body
    // ------------------------------------------------
    const inventoryPayload = {
      productId: product.productId,
      productName: product.name,
      currentStock: initialStock,
      reservedStock: 0,
      lowStockThreshold: threshold
    };

    let inventoryResponse;

    // ------------------------------------------------
    // Step 2: Create Inventory
    // ------------------------------------------------
    try {
      inventoryResponse = await axios.post(
        `${inventoryServiceUrl}/api/inventory`,
        inventoryPayload,
        {
          timeout: 10000,
          headers: {
            "Content-Type": "application/json",
            ...(req.headers['authorization'] ? { Authorization: req.headers['authorization'] } : {})
          }
        }
      );
    } catch (inventoryError) {
      console.error(
        "Inventory creation error:",
        inventoryError.response?.data ||
          inventoryError.message
      );

      // ----------------------------------------------
      // Step 3: Roll back Product
      // ----------------------------------------------
      try {
        await db.send(
          new DeleteCommand({
            TableName: TABLE,
            Key: {
              productId: createdProductId
            }
          })
        );

        productCreated = false;
      } catch (rollbackError) {
        console.error(
          "Product rollback error:",
          rollbackError
        );

        return res.status(500).json({
          message:
            "Inventory creation failed and product rollback also failed",
          productId: createdProductId,
          inventoryError:
            inventoryError.response?.data?.message ||
            inventoryError.message,
          rollbackError: rollbackError.message
        });
      }

      return res.status(502).json({
        message:
          "Inventory creation failed. Product creation was rolled back.",
        error:
          inventoryError.response?.data?.message ||
          inventoryError.message
      });
    }

    // ------------------------------------------------
    // Both operations successful
    // ------------------------------------------------
    return res.status(201).json({
      message:
        "Product and inventory created successfully",
      product,
      inventory: inventoryResponse.data
    });
  } catch (error) {
    console.error("Create product error:", error);

    // Extra rollback protection
    if (productCreated && createdProductId) {
      try {
        await db.send(
          new DeleteCommand({
            TableName: TABLE,
            Key: {
              productId: createdProductId
            }
          })
        );
      } catch (rollbackError) {
        console.error(
          "Unexpected rollback error:",
          rollbackError
        );
      }
    }

    if (
      error.name ===
      "ConditionalCheckFailedException"
    ) {
      return res.status(409).json({
        message: "Product already exists"
      });
    }

    return res.status(500).json({
      message: error.message
    });
  }
};

// ----------------------------------------------------
// UPDATE PRODUCT
// PUT /api/products/:id
// ----------------------------------------------------
const updateProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      stock,
      imageUrl
    } = req.body;

    if (
      !name ||
      price === undefined ||
      stock === undefined
    ) {
      return res.status(400).json({
        message:
          "name, price, and stock are required"
      });
    }

    const productPrice = Number(price);
    const productStock = Number(stock);

    if (
      Number.isNaN(productPrice) ||
      productPrice < 0
    ) {
      return res.status(400).json({
        message: "Invalid product price"
      });
    }

    if (
      Number.isNaN(productStock) ||
      productStock < 0
    ) {
      return res.status(400).json({
        message: "Invalid stock value"
      });
    }

    const result = await db.send(
      new UpdateCommand({
        TableName: TABLE,

        Key: {
          productId: req.params.id
        },

        UpdateExpression:
          "SET #productName = :name, " +
          "description = :description, " +
          "price = :price, " +
          "category = :category, " +
          "stock = :stock, " +
          "imageUrl = :imageUrl, " +
          "updatedAt = :updatedAt",

        ExpressionAttributeNames: {
          "#productName": "name"
        },

        ExpressionAttributeValues: {
          ":name": name,
          ":description": description || "",
          ":price": productPrice,
          ":category": category || "",
          ":stock": productStock,
          ":imageUrl": imageUrl || "",
          ":updatedAt": new Date().toISOString()
        },

        ConditionExpression:
          "attribute_exists(productId)",

        ReturnValues: "ALL_NEW"
      })
    );

    return res.status(200).json({
      message: "Product updated successfully",
      product: result.Attributes
    });
  } catch (error) {
    if (
      error.name ===
      "ConditionalCheckFailedException"
    ) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    return res.status(500).json({
      message: error.message
    });
  }
};

// ----------------------------------------------------
// DELETE PRODUCT
// DELETE /api/products/:id
// ----------------------------------------------------
const deleteProduct = async (req, res) => {
  try {
    const result = await db.send(
      new DeleteCommand({
        TableName: TABLE,

        Key: {
          productId: req.params.id
        },

        ConditionExpression:
          "attribute_exists(productId)",

        ReturnValues: "ALL_OLD"
      })
    );

    return res.status(200).json({
      message: "Product removed successfully",
      product: result.Attributes
    });
  } catch (error) {
    if (
      error.name ===
      "ConditionalCheckFailedException"
    ) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    return res.status(500).json({
      message: error.message
    });
  }
};

// ----------------------------------------------------
// UPDATE PRODUCT STOCK
// PATCH /api/products/:id/stock
// ----------------------------------------------------
const updateStock = async (req, res) => {
  try {
    const stock = Number(req.body.stock);

    if (
      req.body.stock === undefined ||
      Number.isNaN(stock) ||
      stock < 0
    ) {
      return res.status(400).json({
        message:
          "A valid non-negative stock value is required"
      });
    }

    const result = await db.send(
      new UpdateCommand({
        TableName: TABLE,

        Key: {
          productId: req.params.id
        },

        UpdateExpression:
          "SET stock = :stock, updatedAt = :updatedAt",

        ExpressionAttributeValues: {
          ":stock": stock,
          ":updatedAt": new Date().toISOString()
        },

        ConditionExpression:
          "attribute_exists(productId)",

        ReturnValues: "ALL_NEW"
      })
    );

    return res.status(200).json({
      message: "Product stock updated",
      product: result.Attributes
    });
  } catch (error) {
    if (
      error.name ===
      "ConditionalCheckFailedException"
    ) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    return res.status(500).json({
      message: error.message
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