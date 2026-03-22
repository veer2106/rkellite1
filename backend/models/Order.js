const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  orderNumber: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  orderType: {
    type: DataTypes.ENUM('dine-in', 'takeaway', 'delivery', 'online'),
    defaultValue: 'dine-in'
  },
  section: {
    type: DataTypes.ENUM('lodge-dine', 'cafe-restaurant'),
    allowNull: true,
    defaultValue: null
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'preparing', 'ready', 'served', 'completed', 'cancelled'),
    defaultValue: 'pending'
  },
  tableNumber: {
    type: DataTypes.STRING
  },
  customerName: {
    type: DataTypes.STRING
  },
  customerPhone: {
    type: DataTypes.STRING
  },
  customerEmail: {
    type: DataTypes.STRING
  },
  deliveryAddress: {
    type: DataTypes.TEXT
  },
  items: {
    type: DataTypes.JSONB,
    defaultValue: [],
    allowNull: false
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  tax: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  discount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  deliveryFee: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  paymentMethod: {
    type: DataTypes.ENUM('cash', 'card', 'online', 'wallet'),
    defaultValue: 'cash'
  },
  paymentStatus: {
    type: DataTypes.ENUM('pending', 'paid', 'refunded'),
    defaultValue: 'pending'
  },
  notes: {
    type: DataTypes.TEXT
  },
  preparationTime: {
    type: DataTypes.INTEGER
  },
  completedAt: {
    type: DataTypes.DATE
  },
  // State timestamps - Track when order moves through each state
  pendingAt: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW
  },
  confirmedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  preparingAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  readyAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  servedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  completedAtTimestamp: {
    type: DataTypes.DATE,
    allowNull: true
  },
  cancelledAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  customerId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Customers',
      key: 'id'
    }
  }
}, {
  timestamps: true
});

module.exports = Order;
