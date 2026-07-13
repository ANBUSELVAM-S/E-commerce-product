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
const createInventory = async (req, res) => {
  try {

    const inventory = {
      productId: req.body.productId,
      inventoryId: crypto.randomUUID(),
      productName: req.body.productName,
      sku: req.body.sku,
      warehouseLocation: req.body.warehouseLocation,
      currentStock: req.body.currentStock || 0,
      reservedStock: req.body.reservedStock || 0,
      lowStockThreshold: req.body.lowStockThreshold || 10,
      availableStock:
        (req.body.currentStock || 0) -
        (req.body.reservedStock || 0),
      movements: [],
      createdAt: new Date().toISOString()
    };

    await dynamoDB.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: inventory
      })
    );

    res.status(201).json(inventory);

  } catch (error) {

    res.status(500).json({
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

      items = items.filter(item =>
        item.availableStock <= item.lowStockThreshold
      );

    }

    res.json(items);

  } catch (error) {

    res.status(500).json({
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

    const result = await dynamoDB.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          productId: req.params.productId
        }
      })
    );

    if (!result.Item) {

      return res.status(404).json({
        message: "Inventory not found"
      });

    }

    res.json(result.Item);

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }

};

// ----------------------------------------------------
// Get Inventory By inventoryId
// GET /api/inventory/:id
// ----------------------------------------------------
const getInventoryById = async (req, res) => {

  try {

    const result = await dynamoDB.send(
      new ScanCommand({
        TableName: TABLE_NAME
      })
    );

    const item = result.Items.find(
      x => x.inventoryId === req.params.id
    );

    if (!item) {

      return res.status(404).json({
        message: "Inventory item not found"
      });

    }

    res.json(item);

  } catch (error) {

    res.status(500).json({
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

    const result = await dynamoDB.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          productId: req.params.productId
        }
      })
    );

    if (!result.Item) {
      return res.status(404).json({
        message: "Inventory item not found"
      });
    }

    const item = {
      ...result.Item,
      ...req.body
    };

    item.availableStock =
      item.currentStock - item.reservedStock;

    await dynamoDB.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: item
      })
    );

    res.json(item);

  } catch (error) {

    res.status(500).json({
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

    const result = await dynamoDB.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          productId: req.params.productId
        }
      })
    );

    if (!result.Item) {
      return res.status(404).json({
        message: "Inventory item not found"
      });
    }

    await dynamoDB.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: {
          productId: req.params.productId
        }
      })
    );

    res.json({
      message: "Inventory item deleted successfully"
    });

  } catch (error) {

    res.status(500).json({
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

    const { type, quantity, reason } = req.body;

    const result = await dynamoDB.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          productId: req.params.productId
        }
      })
    );

    if (!result.Item) {
      return res.status(404).json({
        message: "Inventory item not found"
      });
    }

    const item = result.Item;

    let currentStock = item.currentStock;
    let reservedStock = item.reservedStock;

    switch (type) {

      case "addition":
        currentStock += Number(quantity);
        break;

      case "removal":
        currentStock -= Number(quantity);
        break;

      case "reservation":
        reservedStock += Number(quantity);
        break;

      case "release":
        reservedStock -= Number(quantity);
        break;

      case "adjustment":
        currentStock = Number(quantity);
        break;

      default:
        return res.status(400).json({
          message: "Invalid adjustment type"
        });

    }

    if (
      currentStock < 0 ||
      reservedStock < 0 ||
      currentStock - reservedStock < 0
    ) {
      return res.status(400).json({
        message: "Operation would result in negative stock"
      });
    }

    item.currentStock = currentStock;
    item.reservedStock = reservedStock;
    item.availableStock = currentStock - reservedStock;

    item.movements = item.movements || [];

    item.movements.push({
      type,
      quantity,
      reason,
      date: new Date().toISOString()
    });

    await dynamoDB.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: item
      })
    );

    res.json(item);

  } catch (error) {

    res.status(500).json({
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
      item => item.availableStock <= item.lowStockThreshold
    );

    res.json(items);

  } catch (error) {

    res.status(500).json({
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

    const result = await dynamoDB.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          productId: req.params.productId
        }
      })
    );

    if (!result.Item) {

      return res.status(404).json({
        message: "Inventory item not found"
      });

    }

    const movements = (result.Item.movements || []).sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );

    res.json(movements);

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }

};

// ----------------------------------------------------
// Exports
// ----------------------------------------------------
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