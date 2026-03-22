const { InventoryItem, InventoryDepletion } = require('../models');
const { Op } = require('sequelize');

// @desc    Get all inventory items
// @route   GET /api/inventory
// @access  Private
exports.getInventoryItems = async (req, res) => {
  try {
    const { category, lowStock, search } = req.query;
    
    let where = { isActive: true };
    
    if (category) where.category = category;
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { sku: { [Op.iLike]: `%${search}%` } }
      ];
    }

    /**
     * Fetches all inventory items from the database based on specified filter criteria.
     * Results are sorted alphabetically by item name in ascending order.
     * 
     * @async
     * @param {Object} where - Filter conditions object for querying inventory items
     * @returns {Promise<Array>} A promise that resolves to an array of InventoryItem objects sorted by name
     * @throws {Error} If the database query fails
     */
    let items = await InventoryItem.findAll({
      where,
      order: [['name', 'ASC']]
    });

    // Filter low stock items
    if (lowStock === 'true') {
      items = items.filter(item => 
        parseFloat(item.currentStock) <= parseFloat(item.minStock)
      );
    }

    res.json({
      success: true,
      count: items.length,
      data: items
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single inventory item
// @route   GET /api/inventory/:id
// @access  Private
exports.getInventoryItem = async (req, res) => {
  try {
    const item = await InventoryItem.findByPk(req.params.id);

    if (!item) {
      return res.status(404).json({ success: false, message: 'Inventory item not found' });
    }

    res.json({
      success: true,
      data: item
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create inventory item
// @route   POST /api/inventory
// @access  Private (Admin/Manager)
exports.createInventoryItem = async (req, res) => {
  try {
    // Generate SKU if not provided
    if (!req.body.sku) {
      req.body.sku = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    }

    const item = await InventoryItem.create(req.body);

    res.status(201).json({
      success: true,
      data: item
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update inventory item
// @route   PUT /api/inventory/:id
// @access  Private (Admin/Manager)
exports.updateInventoryItem = async (req, res) => {
  try {
    const item = await InventoryItem.findByPk(req.params.id);

    if (!item) {
      return res.status(404).json({ success: false, message: 'Inventory item not found' });
    }

    const updatedItem = await item.update(req.body);

    res.json({
      success: true,
      data: updatedItem
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete inventory item
// @route   DELETE /api/inventory/:id
// @access  Private (Admin/Manager)
exports.deleteInventoryItem = async (req, res) => {
  try {
    const item = await InventoryItem.findByPk(req.params.id);

    if (!item) {
      return res.status(404).json({ success: false, message: 'Inventory item not found' });
    }

    await item.update({ isActive: false });

    res.json({
      success: true,
      message: 'Inventory item deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Deplete inventory (reduce stock)
// @route   POST /api/inventory/:id/deplete
// @access  Private (Admin/Supervisor - same as inventory management)
exports.depleteItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    const item = await InventoryItem.findByPk(req.params.id);

    if (!item) {
      return res.status(404).json({ success: false, message: 'Inventory item not found' });
    }

    const depletionQty = parseFloat(quantity);
    if (isNaN(depletionQty) || depletionQty <= 0) {
      return res.status(400).json({ success: false, message: 'Valid depletion quantity is required' });
    }

    const previousStock = parseFloat(item.currentStock);
    const newStock = previousStock - depletionQty;

    if (newStock < 0) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Current: ${previousStock}, cannot deplete ${depletionQty}`
      });
    }

    item.currentStock = newStock;
    await item.save();

    await InventoryDepletion.create({
      inventoryItemId: item.id,
      quantity: depletionQty,
      previousStock,
      newStock,
      userId: req.user?.id
    });

    res.json({
      success: true,
      data: item
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Restock inventory item
// @route   POST /api/inventory/:id/restock
// @access  Private
exports.restockItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    const item = await InventoryItem.findByPk(req.params.id);

    if (!item) {
      return res.status(404).json({ success: false, message: 'Inventory item not found' });
    }

    item.currentStock = parseFloat(item.currentStock) + parseFloat(quantity);
    item.lastRestockDate = new Date();
    await item.save();

    res.json({
      success: true,
      data: item
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reduce inventory stock (consumption)
// @route   POST /api/inventory/:id/consume
// @access  Private
exports.consumeItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    const item = await InventoryItem.findByPk(req.params.id);

    if (!item) {
      return res.status(404).json({ success: false, message: 'Inventory item not found' });
    }

    const newStock = parseFloat(item.currentStock) - parseFloat(quantity);
    
    if (newStock < 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Insufficient stock' 
      });
    }

    item.currentStock = newStock;
    await item.save();

    // Check if stock is low and send alert
    if (item.currentStock <= item.minStock) {
      const io = req.app.get('io');
      io.emit('lowStockAlert', item);
    }

    res.json({
      success: true,
      data: item
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get low stock items
// @route   GET /api/inventory/alerts/low-stock
// @access  Private
exports.getLowStockItems = async (req, res) => {
  try {
    const items = await InventoryItem.findAll({
      where: { isActive: true }
    });

    const lowStockItems = items.filter(item => 
      parseFloat(item.currentStock) <= parseFloat(item.minStock)
    );

    res.json({
      success: true,
      count: lowStockItems.length,
      data: lowStockItems
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
