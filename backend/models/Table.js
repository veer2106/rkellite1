const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Table = sequelize.define('Table', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  tableNumber: {
    type: DataTypes.STRING,
    allowNull: false
  },
  section: {
    type: DataTypes.ENUM('lodge-dine', 'cafe-restaurant'),
    allowNull: false
  },
  seats: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 4
  },
  status: {
    type: DataTypes.ENUM('available', 'occupied', 'reserved', 'cleaning'),
    defaultValue: 'available'
  },
  location: {
    type: DataTypes.STRING
  },
  qrCode: {
    type: DataTypes.TEXT
  },
  currentOrderId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['tableNumber', 'section']
    }
  ]
});

module.exports = Table;
