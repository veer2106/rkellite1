const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SystemSetting = sequelize.define(
  'SystemSetting',
  {
    key: {
      type: DataTypes.STRING(128),
      primaryKey: true
    },
    value: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: ''
    }
  },
  {
    tableName: 'SystemSettings',
    timestamps: true,
    updatedAt: true,
    createdAt: false
  }
);

module.exports = SystemSetting;
