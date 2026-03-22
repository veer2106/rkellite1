const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Schedule = sequelize.define('Schedule', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  shiftStart: {
    type: DataTypes.TIME,
    allowNull: false
  },
  shiftEnd: {
    type: DataTypes.TIME,
    allowNull: false
  },
  shiftType: {
    type: DataTypes.ENUM('morning', 'afternoon', 'evening', 'night'),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('scheduled', 'completed', 'absent', 'cancelled'),
    defaultValue: 'scheduled'
  },
  notes: {
    type: DataTypes.TEXT
  }
}, {
  timestamps: true
});

module.exports = Schedule;
