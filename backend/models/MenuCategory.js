const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const MenuCategory = sequelize.define('MenuCategory', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  sortOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  }
}, {
  timestamps: true,
  indexes: [
    { unique: true, fields: ['name'] }
  ]
});

module.exports = MenuCategory;
