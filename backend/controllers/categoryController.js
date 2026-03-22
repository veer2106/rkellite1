const { MenuCategory, MenuItem } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

// @desc    Get all menu categories
// @route   GET /api/menu/categories
// @access  Public
exports.getCategories = async (req, res) => {
  try {
    const categories = await MenuCategory.findAll({
      order: [['sortOrder', 'ASC'], ['name', 'ASC']],
      raw: true
    });

    if (categories.length === 0) {
      const fromMenuItems = await MenuItem.findAll({
        attributes: ['category'],
        group: ['category'],
        raw: true
      });
      const names = fromMenuItems.map(c => c.category).filter(Boolean);
      const uniqueNames = [...new Set(names)];
      return res.json({
        success: true,
        data: uniqueNames.map((name, i) => ({ id: null, name, sortOrder: i }))
      });
    }

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create menu category
// @route   POST /api/menu/categories
// @access  Private (Admin only)
exports.createCategory = async (req, res) => {
  try {
    const { name, sortOrder } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }

    const normalizedName = name.trim();
    const existing = await MenuCategory.findOne({
      where: { name: { [Op.iLike]: normalizedName } }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Category "${normalizedName}" already exists`
      });
    }

    const category = await MenuCategory.create({
      name: normalizedName,
      sortOrder: sortOrder != null ? parseInt(sortOrder, 10) : 0
    });

    logger.info('Menu category created', {
      categoryId: category.id,
      name: category.name,
      userId: req.user?.id
    });

    res.status(201).json({
      success: true,
      data: category
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update menu category
// @route   PUT /api/menu/categories/:id
// @access  Private (Admin only)
exports.updateCategory = async (req, res) => {
  try {
    const { name, sortOrder } = req.body;
    const category = await MenuCategory.findByPk(req.params.id);

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const updates = {};
    if (name !== undefined && name.trim()) {
      const normalizedName = name.trim();
      const existing = await MenuCategory.findOne({
        where: {
          name: { [Op.iLike]: normalizedName },
          id: { [Op.ne]: category.id }
        }
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: `Category "${normalizedName}" already exists`
        });
      }
      const oldName = category.name;
      updates.name = normalizedName;
      await MenuItem.update(
        { category: normalizedName },
        { where: { category: oldName } }
      );
    }
    if (sortOrder !== undefined) {
      updates.sortOrder = parseInt(sortOrder, 10);
    }

    const updated = await category.update(updates);

    logger.info('Menu category updated', {
      categoryId: category.id,
      updates: Object.keys(updates),
      userId: req.user?.id
    });

    res.json({
      success: true,
      data: updated
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete menu category
// @route   DELETE /api/menu/categories/:id
// @access  Private (Admin only)
exports.deleteCategory = async (req, res) => {
  try {
    const category = await MenuCategory.findByPk(req.params.id);

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const itemCount = await MenuItem.count({
      where: { category: { [Op.iLike]: category.name } }
    });

    if (itemCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category. ${itemCount} menu item(s) are using it. Reassign or remove those items first.`
      });
    }

    await category.destroy();

    logger.info('Menu category deleted', {
      categoryId: category.id,
      name: category.name,
      userId: req.user?.id
    });

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
