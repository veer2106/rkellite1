const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const InventoryDepletion = sequelize.define('InventoryDepletion', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  inventoryItemId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'InventoryItems', key: 'id' }
  },
  quantity: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  previousStock: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  newStock: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'Users', key: 'id' }
  }
}, {
  timestamps: true,
  indexes: [
    { fields: ['inventoryItemId'] },
    { fields: ['createdAt'] }
  ]
});

module.exports = InventoryDepletion;
