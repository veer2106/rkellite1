const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const InventoryItem = sequelize.define('InventoryItem', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false
  },
  unit: {
    type: DataTypes.STRING,
    allowNull: false // kg, liters, pieces, etc.
  },
  currentStock: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  minStock: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  maxStock: {
    type: DataTypes.DECIMAL(10, 2)
  },
  reorderPoint: {
    type: DataTypes.DECIMAL(10, 2)
  },
  unitPrice: {
    type: DataTypes.DECIMAL(10, 2)
  },
  supplier: {
    type: DataTypes.STRING
  },
  supplierContact: {
    type: DataTypes.STRING
  },
  lastRestockDate: {
    type: DataTypes.DATE
  },
  expiryDate: {
    type: DataTypes.DATE
  },
  location: {
    type: DataTypes.STRING
  },
  sku: {
    type: DataTypes.STRING,
    unique: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  notes: {
    type: DataTypes.TEXT
  }
}, {
  timestamps: true
});

module.exports = InventoryItem;
