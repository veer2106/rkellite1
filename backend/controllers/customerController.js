const { Customer, Order } = require('../models');
const { Op } = require('sequelize');

// @desc    Get all customers
// @route   GET /api/customers
// @access  Private
exports.getCustomers = async (req, res) => {
  try {
    const { search, loyaltyTier, page = 1, limit = 50 } = req.query;
    
    let where = { isActive: true };
    
    if (loyaltyTier) where.loyaltyTier = loyaltyTier;
    if (search) {
      where[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { phone: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const offset = (page - 1) * limit;

    const customers = await Customer.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: offset,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      count: customers.count,
      page: parseInt(page),
      pages: Math.ceil(customers.count / limit),
      data: customers.rows
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single customer
// @route   GET /api/customers/:id
// @access  Private
exports.getCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id);

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    // Get customer orders
    const orders = await Order.findAll({
      where: { customerId: req.params.id },
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    res.json({
      success: true,
      data: {
        ...customer.toJSON(),
        recentOrders: orders
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create customer
// @route   POST /api/customers
// @access  Private
exports.createCustomer = async (req, res) => {
  try {
    const customer = await Customer.create(req.body);

    res.status(201).json({
      success: true,
      data: customer
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update customer
// @route   PUT /api/customers/:id
// @access  Private
exports.updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id);

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const updatedCustomer = await customer.update(req.body);

    res.json({
      success: true,
      data: updatedCustomer
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete customer
// @route   DELETE /api/customers/:id
// @access  Private (Admin)
exports.deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id);

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    await customer.update({ isActive: false });

    res.json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add loyalty points
// @route   POST /api/customers/:id/loyalty/add
// @access  Private
exports.addLoyaltyPoints = async (req, res) => {
  try {
    const { points } = req.body;
    const customer = await Customer.findByPk(req.params.id);

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    customer.loyaltyPoints += parseInt(points);
    
    // Update loyalty tier based on points
    if (customer.loyaltyPoints >= 10000) {
      customer.loyaltyTier = 'platinum';
    } else if (customer.loyaltyPoints >= 5000) {
      customer.loyaltyTier = 'gold';
    } else if (customer.loyaltyPoints >= 2000) {
      customer.loyaltyTier = 'silver';
    }

    await customer.save();

    res.json({
      success: true,
      data: customer
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Redeem loyalty points
// @route   POST /api/customers/:id/loyalty/redeem
// @access  Private
exports.redeemLoyaltyPoints = async (req, res) => {
  try {
    const { points } = req.body;
    const customer = await Customer.findByPk(req.params.id);

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    if (customer.loyaltyPoints < points) {
      return res.status(400).json({ 
        success: false, 
        message: 'Insufficient loyalty points' 
      });
    }

    customer.loyaltyPoints -= parseInt(points);
    await customer.save();

    res.json({
      success: true,
      data: customer,
      discountAmount: points / 100 // 1 point = 0.01 currency
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get top customers
// @route   GET /api/customers/stats/top
// @access  Private
exports.getTopCustomers = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const customers = await Customer.findAll({
      where: { isActive: true },
      order: [['totalSpent', 'DESC']],
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: customers
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
