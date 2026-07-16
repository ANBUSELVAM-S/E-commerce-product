const crypto = require("crypto");
const dynamoDB = require("../config/db");

const {
  PutCommand,
  GetCommand,
  ScanCommand,
  UpdateCommand,
  DeleteCommand
} = require("@aws-sdk/lib-dynamodb");

const TABLE_NAME = process.env.INVENTORY_TABLE;

// ----------------------------------------------------
// Create Inventory
// POST /api/inventory
// ----------------------------------------------------
// ----------------------------------------------------
// CREATE INVENTORY
// POST /api/inventory
// ----------------------------------------------------
// ----------------------------------------------------
// CREATE INVENTORY
// POST /api/inventory
// ----------------------------------------------------
const createInventory = async (req, res) => {
  try {
    const {
      productId,
      productName,
      currentStock = 0,
      reservedStock = 0,
      lowStockThreshold = 10
    } = req.body;

    if (
      !productId ||
      !productName
    ) {
      return res.status(400).json({
        message:
          "productId, productName are required"
      });
    }

    const currentStockValue =
      Number(currentStock);

    const reservedStockValue =
      Number(reservedStock);

    const thresholdValue =
      Number(lowStockThreshold);

    if (
      Number.isNaN(currentStockValue) ||
      Number.isNaN(reservedStockValue) ||
      Number.isNaN(thresholdValue)
    ) {
      return res.status(400).json({
        message:
          "Stock values must be valid numbers"
      });
    }

    if (
      currentStockValue < 0 ||
      reservedStockValue < 0 ||
      thresholdValue < 0
    ) {
      return res.status(400).json({
        message:
          "Stock values cannot be negative"
      });
    }

    if (
      reservedStockValue > currentStockValue
    ) {
      return res.status(400).json({
        message:
          "Reserved stock cannot be greater than current stock"
      });
    }

    const createdAt =
      new Date().toISOString();

    const item = {
      productId,
      inventoryId: crypto.randomUUID(),
      productName,
      currentStock: currentStockValue,
      reservedStock: reservedStockValue,
      lowStockThreshold: thresholdValue,
      availableStock:
        currentStockValue -
        reservedStockValue,

      movements: [
        {
          movementId: crypto.randomUUID(),
          type: "initial",
          quantity: currentStockValue,
          reason:
            "Initial inventory created with product",
          date: createdAt
        }
      ],

      createdAt,
      updatedAt: createdAt
    };

    await dynamoDB.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: item,

        // Avoid duplicate inventory for same product
        ConditionExpression:
          "attribute_not_exists(productId)"
      })
    );

    return res.status(201).json(item);
  } catch (error) {
    if (
      error.name ===
      "ConditionalCheckFailedException"
    ) {
      return res.status(409).json({
        message:
          "Inventory already exists for this product"
      });
    }

    return res.status(500).json({
      message: error.message
    });
  }
};
// ----------------------------------------------------
// Get All Inventory
// GET /api/inventory
// ----------------------------------------------------
const getAllInventory = async (req, res) => {
  try {
    const result = await dynamoDB.send(
      new ScanCommand({
        TableName: TABLE_NAME
      })
    );

    let items = result.Items || [];

    if (req.query.lowStock === "true") {
      items = items.filter(
        item =>
          Number(item.availableStock) <=
          Number(item.lowStockThreshold)
      );
    }

    items.sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt) -
        new Date(a.updatedAt || a.createdAt)
    );

    return res.status(200).json(items);
  } catch (error) {
    console.error("getAllInventory error:", error);

    return res.status(500).json({
      message: error.message
    });
  }
};

// ----------------------------------------------------
// Get Inventory By ProductId
// GET /api/inventory/product/:productId
// ----------------------------------------------------
const getInventoryByProductId = async (req, res) => {
  try {
    const productId = req.params.productId;

    const result = await dynamoDB.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          productId
        }
      })
    );

    if (!result.Item) {
      return res.status(404).json({
        message: "Inventory item not found"
      });
    }

    return res.status(200).json(result.Item);
  } catch (error) {
    console.error("getInventoryByProductId error:", error);

    return res.status(500).json({
      message: error.message
    });
  }
};

// ----------------------------------------------------
// Get Inventory By InventoryId
// GET /api/inventory/id/:inventoryId
// ----------------------------------------------------
const getInventoryById = async (req, res) => {
  try {
    const result = await dynamoDB.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: "inventoryId = :inventoryId",
        ExpressionAttributeValues: {
          ":inventoryId": req.params.inventoryId
        }
      })
    );

    const item = result.Items?.[0];

    if (!item) {
      return res.status(404).json({
        message: "Inventory item not found"
      });
    }

    return res.status(200).json(item);
  } catch (error) {
    console.error("getInventoryById error:", error);

    return res.status(500).json({
      message: error.message
    });
  }
};

// ----------------------------------------------------
// Update Inventory
// PUT /api/inventory/:productId
// ----------------------------------------------------
const updateInventory = async (req, res) => {
  try {
    const productId = req.params.productId;

    const existing = await dynamoDB.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          productId
        }
      })
    );

    if (!existing.Item) {
      return res.status(404).json({
        message: "Inventory item not found"
      });
    }

    const allowedUpdates = [
      "productName",
      "currentStock",
      "reservedStock",
      "lowStockThreshold"
    ];

    const item = {
      ...existing.Item
    };

    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        item[key] = req.body[key];
      }
    }

    item.currentStock = Number(item.currentStock);
    item.reservedStock = Number(item.reservedStock);
    item.lowStockThreshold = Number(item.lowStockThreshold);

    if (
      Number.isNaN(item.currentStock) ||
      Number.isNaN(item.reservedStock) ||
      Number.isNaN(item.lowStockThreshold)
    ) {
      return res.status(400).json({
        message: "Stock values must be valid numbers"
      });
    }

    if (
      item.currentStock < 0 ||
      item.reservedStock < 0 ||
      item.lowStockThreshold < 0
    ) {
      return res.status(400).json({
        message: "Stock values cannot be negative"
      });
    }

    if (item.reservedStock > item.currentStock) {
      return res.status(400).json({
        message: "reservedStock cannot be greater than currentStock"
      });
    }

    item.availableStock =
      item.currentStock - item.reservedStock;

    item.updatedAt = new Date().toISOString();

    await dynamoDB.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: item
      })
    );

    return res.status(200).json(item);
  } catch (error) {
    console.error("updateInventory error:", error);

    return res.status(500).json({
      message: error.message
    });
  }
};

// ----------------------------------------------------
// Delete Inventory
// DELETE /api/inventory/:productId
// ----------------------------------------------------
const deleteInventory = async (req, res) => {
  try {
    const productId = req.params.productId;

    const existing = await dynamoDB.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          productId
        }
      })
    );

    if (!existing.Item) {
      return res.status(404).json({
        message: "Inventory item not found"
      });
    }

    await dynamoDB.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: {
          productId
        }
      })
    );

    return res.status(200).json({
      message: "Inventory item deleted successfully"
    });
  } catch (error) {
    console.error("deleteInventory error:", error);

    return res.status(500).json({
      message: error.message
    });
  }
};

// ----------------------------------------------------
// Adjust Stock
// PATCH /api/inventory/:productId/adjust
// ----------------------------------------------------
const adjustStock = async (req, res) => {
  try {
    const productId = req.params.productId;

    const {
      type,
      quantity,
      reason
    } = req.body;

    const allowedTypes = [
      "addition",
      "removal",
      "reservation",
      "release",
      "adjustment"
    ];

    if (!type || quantity === undefined) {
      return res.status(400).json({
        message: "type and quantity are required"
      });
    }

    if (!allowedTypes.includes(type)) {
      return res.status(400).json({
        message:
          "Invalid adjustment type. Use addition, removal, reservation, release, or adjustment"
      });
    }

    const numericQuantity = Number(quantity);

    if (
      Number.isNaN(numericQuantity) ||
      numericQuantity <= 0
    ) {
      return res.status(400).json({
        message: "quantity must be greater than 0"
      });
    }

    console.log("Adjusting inventory:", {
      productId,
      type,
      quantity: numericQuantity,
      reason
    });

    const result = await dynamoDB.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          productId
        }
      })
    );

    if (!result.Item) {
      console.error(
        "Inventory item not found for productId:",
        productId
      );

      return res.status(404).json({
        message: `Inventory item not found for productId: ${productId}`
      });
    }

    const item = result.Item;

    let currentStock = Number(item.currentStock || 0);
    let reservedStock = Number(item.reservedStock || 0);

    switch (type) {
      case "addition":
        currentStock += numericQuantity;
        break;

      case "removal":
        if (
          currentStock - reservedStock <
          numericQuantity
        ) {
          return res.status(400).json({
            message: "Insufficient available stock"
          });
        }

        currentStock -= numericQuantity;
        break;

      case "reservation":
        if (
          currentStock - reservedStock <
          numericQuantity
        ) {
          return res.status(400).json({
            message: "Insufficient available stock for reservation"
          });
        }

        reservedStock += numericQuantity;
        break;

      case "release":
        if (reservedStock < numericQuantity) {
          return res.status(400).json({
            message: "Cannot release more than reserved stock"
          });
        }

        reservedStock -= numericQuantity;
        break;

      case "adjustment":
        if (numericQuantity < reservedStock) {
          return res.status(400).json({
            message:
              "Adjusted stock cannot be lower than reserved stock"
          });
        }

        currentStock = numericQuantity;
        break;
    }

    const availableStock =
      currentStock - reservedStock;

    const movement = {
      movementId: crypto.randomUUID(),
      type,
      quantity: numericQuantity,
      reason: reason || null,
      previousCurrentStock: Number(
        item.currentStock || 0
      ),
      previousReservedStock: Number(
        item.reservedStock || 0
      ),
      newCurrentStock: currentStock,
      newReservedStock: reservedStock,
      newAvailableStock: availableStock,
      date: new Date().toISOString()
    };

    const movements = [
      ...(item.movements || []),
      movement
    ];

    const updateResult = await dynamoDB.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          productId
        },
        UpdateExpression:
          "SET currentStock = :currentStock, " +
          "reservedStock = :reservedStock, " +
          "availableStock = :availableStock, " +
          "movements = :movements, " +
          "updatedAt = :updatedAt",
        ExpressionAttributeValues: {
          ":currentStock": currentStock,
          ":reservedStock": reservedStock,
          ":availableStock": availableStock,
          ":movements": movements,
          ":updatedAt": new Date().toISOString()
        },
        ConditionExpression:
          "attribute_exists(productId)",
        ReturnValues: "ALL_NEW"
      })
    );

    console.log(
      "Inventory updated:",
      updateResult.Attributes
    );

    return res.status(200).json(
      updateResult.Attributes
    );
  } catch (error) {
    console.error("adjustStock error:", error);

    if (
      error.name ===
      "ConditionalCheckFailedException"
    ) {
      return res.status(404).json({
        message: "Inventory item not found"
      });
    }

    return res.status(500).json({
      message: error.message
    });
  }
};

// ----------------------------------------------------
// Get Low Stock Items
// GET /api/inventory/low-stock
// ----------------------------------------------------
const getLowStockItems = async (req, res) => {
  try {
    const result = await dynamoDB.send(
      new ScanCommand({
        TableName: TABLE_NAME
      })
    );

    const items = (result.Items || []).filter(
      item =>
        Number(item.availableStock) <=
        Number(item.lowStockThreshold)
    );

    return res.status(200).json(items);
  } catch (error) {
    console.error("getLowStockItems error:", error);

    return res.status(500).json({
      message: error.message
    });
  }
};

// ----------------------------------------------------
// Get Movement History
// GET /api/inventory/:productId/movements
// ----------------------------------------------------
const getMovementHistory = async (req, res) => {
  try {
    const productId = req.params.productId;

    const result = await dynamoDB.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          productId
        }
      })
    );

    if (!result.Item) {
      return res.status(404).json({
        message: "Inventory item not found"
      });
    }

    const movements = (
      result.Item.movements || []
    ).sort(
      (a, b) =>
        new Date(b.date) - new Date(a.date)
    );

    return res.status(200).json(movements);
  } catch (error) {
    console.error("getMovementHistory error:", error);

    return res.status(500).json({
      message: error.message
    });
  }
};

module.exports = {
  createInventory,
  getAllInventory,
  getInventoryById,
  getInventoryByProductId,
  updateInventory,
  deleteInventory,
  adjustStock,
  getLowStockItems,
  getMovementHistory
};