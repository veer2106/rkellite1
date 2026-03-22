const { User, Schedule } = require('../models');
const { Op } = require('sequelize');

// @desc    Get all staff
// @route   GET /api/staff
// @access  Private (Admin/Manager)
exports.getStaff = async (req, res) => {
  try {
    const { role, department, isActive, page = 1, limit = 50 } = req.query;
    
    let where = {};
    
    if (role) where.role = role;
    if (department) where.department = department;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const offset = (page - 1) * limit;

    const staff = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password'] },
      limit: parseInt(limit),
      offset: offset,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      count: staff.count,
      page: parseInt(page),
      pages: Math.ceil(staff.count / limit),
      data: staff.rows
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single staff member
// @route   GET /api/staff/:id
// @access  Private
exports.getStaffMember = async (req, res) => {
  try {
    const staff = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] }
    });

    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }

    res.json({
      success: true,
      data: staff
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update staff member
// @route   PUT /api/staff/:id
// @access  Private (Admin/Manager)
exports.updateStaffMember = async (req, res) => {
  try {
    const staff = await User.findByPk(req.params.id);

    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }

    // Don't allow password update through this route
    delete req.body.password;

    const updatedStaff = await staff.update(req.body);

    res.json({
      success: true,
      data: updatedStaff
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get staff schedules
// @route   GET /api/staff/schedules
// @access  Private
exports.getSchedules = async (req, res) => {
  try {
    const { date, userId, startDate, endDate } = req.query;
    
    let where = {};
    
    if (date) {
      where.date = date;
    } else if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date[Op.gte] = startDate;
      if (endDate) where.date[Op.lte] = endDate;
    }
    
    if (userId) where.userId = userId;

    const schedules = await Schedule.findAll({
      where,
      include: [{
        model: User,
        as: 'user',
        attributes: ['firstName', 'lastName', 'role', 'email']
      }],
      order: [['date', 'ASC'], ['shiftStart', 'ASC']]
    });

    res.json({
      success: true,
      count: schedules.length,
      data: schedules
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create schedule
// @route   POST /api/staff/schedules
// @access  Private (Admin/Manager)
exports.createSchedule = async (req, res) => {
  try {
    const schedule = await Schedule.create(req.body);

    res.status(201).json({
      success: true,
      data: schedule
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update schedule
// @route   PUT /api/staff/schedules/:id
// @access  Private (Admin/Manager)
exports.updateSchedule = async (req, res) => {
  try {
    const schedule = await Schedule.findByPk(req.params.id);

    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Schedule not found' });
    }

    const updatedSchedule = await schedule.update(req.body);

    res.json({
      success: true,
      data: updatedSchedule
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete schedule
// @route   DELETE /api/staff/schedules/:id
// @access  Private (Admin/Manager)
exports.deleteSchedule = async (req, res) => {
  try {
    const schedule = await Schedule.findByPk(req.params.id);

    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Schedule not found' });
    }

    await schedule.destroy();

    res.json({
      success: true,
      message: 'Schedule deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get staff performance
// @route   GET /api/staff/:id/performance
// @access  Private (Admin/Manager)
exports.getStaffPerformance = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Get orders handled by this staff member
    
    let where = { userId: req.params.id };
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = new Date(startDate);
      if (endDate) where.createdAt[Op.lte] = new Date(endDate);
    }

    const orders = await Order.findAll({ where });
    
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => 
      sum + parseFloat(order.total), 0
    );
    const completedOrders = orders.filter(o => o.status === 'completed').length;

    res.json({
      success: true,
      data: {
        totalOrders,
        completedOrders,
        totalRevenue,
        completionRate: totalOrders > 0 ? (completedOrders / totalOrders * 100).toFixed(2) : 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
