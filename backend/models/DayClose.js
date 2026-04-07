const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DayClose = sequelize.define(
  'DayClose',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    businessDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      unique: true
    },
    closedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    totalRevenue: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0
    },
    orderCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    subtotalSum: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0
    },
    taxSum: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0
    },
    breakdown: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {}
    }
  },
  {
    tableName: 'DayCloses',
    timestamps: false
  }
);

module.exports = DayClose;
