const AuditLog = require('../models/AuditLog');
const User = require('../models/User');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');

// Get audit logs with filtering
exports.getAuditLogs = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      action, 
      entityType, 
      userId,
      startDate,
      endDate,
      search 
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    if (action) where.action = action;
    if (entityType) where.entityType = entityType;
    if (userId) where.userId = userId;
    
    if (startDate && endDate) {
      where.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else if (startDate) {
      where.createdAt = {
        [Op.gte]: new Date(startDate)
      };
    } else if (endDate) {
      where.createdAt = {
        [Op.lte]: new Date(endDate)
      };
    }

    if (search) {
      where[Op.or] = [
        { userName: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { entityType: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows } = await AuditLog.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        logs: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          pages: Math.ceil(count / limit),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit logs'
    });
  }
};

// Get audit log statistics
exports.getAuditStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const where = {};

    if (startDate && endDate) {
      where.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    // Total actions
    const totalActions = await AuditLog.count({ where });

    // Actions by type
    const actionsByType = await AuditLog.findAll({
      where,
      attributes: [
        'action',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['action'],
      raw: true
    });

    // Actions by entity type
    const actionsByEntity = await AuditLog.findAll({
      where,
      attributes: [
        'entityType',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['entityType'],
      raw: true
    });

    // Most active users
    const mostActiveUsers = await AuditLog.findAll({
      where,
      attributes: [
        'userId',
        'userName',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['userId', 'userName'],
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
      limit: 10,
      raw: true
    });

    res.json({
      success: true,
      data: {
        totalActions,
        actionsByType,
        actionsByEntity,
        mostActiveUsers
      }
    });
  } catch (error) {
    console.error('Error fetching audit stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit statistics'
    });
  }
};

// Get audit log by ID
exports.getAuditLogById = async (req, res) => {
  try {
    const log = await AuditLog.findByPk(req.params.id);
    
    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Audit log not found'
      });
    }

    res.json({
      success: true,
      data: log
    });
  } catch (error) {
    console.error('Error fetching audit log:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit log'
    });
  }
};

// Create audit log (used by middleware)
exports.createAuditLog = async (logData) => {
  try {
    const log = await AuditLog.create(logData);
    return log;
  } catch (error) {
    console.error('Error creating audit log:', error);
    throw error;
  }
};
