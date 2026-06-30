const Inventory = require('../models/Inventory');

const createInventory = async (req, res) => {
  try {
    const inventory = new Inventory(req.body);
    const savedInventory = await inventory.save();
    res.status(201).json(savedInventory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllInventory = async (req, res) => {
  try {
    const { lowStock, page = 1, limit = 20 } = req.query;
    let query = {};
    
    if (lowStock === 'true') {
      // Find items where availableStock is less than or equal to lowStockThreshold
      query = { $expr: { $lte: ['$availableStock', '$lowStockThreshold'] } };
    }

    const items = await Inventory.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
      
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getInventoryById = async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id);
    if (item) {
      res.json(item);
    } else {
      res.status(404).json({ message: 'Inventory item not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getInventoryByProductId = async (req, res) => {
  try {
    const item = await Inventory.findOne({ productId: req.params.productId });
    if (item) {
      res.json(item);
    } else {
      res.status(404).json({ message: 'Inventory for product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateInventory = async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }
    
    Object.assign(item, req.body);
    const updatedItem = await item.save();
    res.json(updatedItem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteInventory = async (req, res) => {
  try {
    const item = await Inventory.findByIdAndDelete(req.params.id);
    if (item) {
      res.json({ message: 'Inventory item deleted successfully' });
    } else {
      res.status(404).json({ message: 'Inventory item not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const adjustStock = async (req, res) => {
  try {
    const { type, quantity, reason } = req.body;
    if (!type || quantity === undefined) {
      return res.status(400).json({ message: 'type and quantity are required' });
    }

    const item = await Inventory.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    let newCurrentStock = item.currentStock;
    let newReservedStock = item.reservedStock;

    switch (type) {
      case 'addition':
        newCurrentStock += quantity;
        break;
      case 'removal':
        newCurrentStock -= quantity;
        break;
      case 'reservation':
        newReservedStock += quantity;
        break;
      case 'release':
        newReservedStock -= quantity;
        break;
      case 'adjustment':
        newCurrentStock = quantity;
        break;
      default:
        return res.status(400).json({ message: 'Invalid adjustment type' });
    }

    if (newCurrentStock < 0 || newReservedStock < 0 || (newCurrentStock - newReservedStock) < 0) {
      return res.status(400).json({ message: 'Operation would result in negative stock' });
    }

    item.currentStock = newCurrentStock;
    item.reservedStock = newReservedStock;
    
    item.movements.push({
      type,
      quantity,
      reason
    });

    const updatedItem = await item.save();
    res.json(updatedItem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getLowStockItems = async (req, res) => {
  try {
    const items = await Inventory.find({ $expr: { $lte: ['$availableStock', '$lowStockThreshold'] } });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMovementHistory = async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }
    
    // Sort movements newest first
    const movements = [...item.movements].sort((a, b) => b.date - a.date);
    res.json(movements);
  } catch (error) {
    res.status(500).json({ message: error.message });
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
