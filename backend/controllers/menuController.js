const MenuItem = require('../models/MenuItem');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

// @desc    Get all menu items
// @route   GET /api/menu
// @access  Public
exports.getMenuItems = async (req, res) => {
  try {
    const { category, isAvailable, search } = req.query;
    
    let where = {};
    
    if (category) where.category = category;
    if (isAvailable !== undefined) where.isAvailable = isAvailable === 'true';
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const menuItems = await MenuItem.findAll({
      where,
      order: [['category', 'ASC'], ['name', 'ASC']]
    });

    res.json({
      success: true,
      count: menuItems.length,
      data: menuItems
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single menu item
// @route   GET /api/menu/:id
// @access  Public
exports.getMenuItem = async (req, res) => {
  try {
    const menuItem = await MenuItem.findByPk(req.params.id);

    if (!menuItem) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }

    res.json({
      success: true,
      data: menuItem
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create menu item
// @route   POST /api/menu
// @access  Private (Admin/Manager)
exports.createMenuItem = async (req, res) => {
  try {
    const menuItem = await MenuItem.create(req.body);

    logger.info('Menu item created', {
      menuItemId: menuItem.id,
      name: menuItem.name,
      category: menuItem.category,
      price: menuItem.price,
      userId: req.user?.id
    });

    res.status(201).json({
      success: true,
      data: menuItem
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update menu item
// @route   PUT /api/menu/:id
// @access  Private (Admin/Manager)
exports.updateMenuItem = async (req, res) => {
  try {
    const menuItem = await MenuItem.findByPk(req.params.id);

    if (!menuItem) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }

    const updatedMenuItem = await menuItem.update(req.body);

    logger.info('Menu item updated', {
      menuItemId: menuItem.id,
      name: menuItem.name,
      updates: Object.keys(req.body),
      userId: req.user?.id
    });

    res.json({
      success: true,
      data: updatedMenuItem
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete menu item
// @route   DELETE /api/menu/:id
// @access  Private (Admin/Manager)
exports.deleteMenuItem = async (req, res) => {
  try {
    const menuItem = await MenuItem.findByPk(req.params.id);

    if (!menuItem) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }

    await menuItem.destroy();

    res.json({
      success: true,
      message: 'Menu item deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update menu item availability
// @route   PUT /api/menu/:id/availability
// @access  Private
exports.updateAvailability = async (req, res) => {
  try {
    const { isAvailable } = req.body;
    const menuItem = await MenuItem.findByPk(req.params.id);

    if (!menuItem) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }

    menuItem.isAvailable = isAvailable;
    await menuItem.save();

    // Emit real-time update
    const io = req.app.get('io');
    io.emit('menuItemUpdated', menuItem);

    res.json({
      success: true,
      data: menuItem
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
