const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Reservation = sequelize.define('Reservation', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  reservationNumber: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  customerName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  customerPhone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  customerEmail: {
    type: DataTypes.STRING
  },
  numberOfGuests: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  reservationDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  reservationTime: {
    type: DataTypes.TIME,
    allowNull: false
  },
  tableNumber: {
    type: DataTypes.STRING
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no-show'),
    defaultValue: 'pending'
  },
  specialRequests: {
    type: DataTypes.TEXT
  },
  occasion: {
    type: DataTypes.STRING
  },
  qrCode: {
    type: DataTypes.TEXT
  },
  customerId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Customers',
      key: 'id'
    }
  },
  notes: {
    type: DataTypes.TEXT
  }
}, {
  timestamps: true
});

module.exports = Reservation;
