const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Room = sequelize.define('Room', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    roomNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            notEmpty: true
        }
    },
    roomType: {
        type: DataTypes.ENUM('standard', 'deluxe', 'suite', 'family', 'executive'),
        defaultValue: 'standard',
        allowNull: false
    },
    floor: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: {
            min: 1,
            max: 10
        }
    },
    capacity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 2,
        validate: {
            min: 1,
            max: 6
        }
    },
    pricePerNight: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
        validate: {
            min: 0
        }
    },
    status: {
        type: DataTypes.ENUM('available', 'occupied', 'maintenance', 'cleaning', 'reserved'),
        defaultValue: 'available',
        allowNull: false
    },
    amenities: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: [],
        comment: 'Room amenities like WiFi, AC, TV, etc.'
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    images: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: [],
        comment: 'Array of image URLs'
    },
    bedType: {
        type: DataTypes.ENUM('single', 'double', 'queen', 'king', 'twin'),
        defaultValue: 'double',
        allowNull: false
    },
    hasBalcony: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    hasWindow: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    smokingAllowed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    lastCleanedAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    lastMaintenanceAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Internal notes for staff'
    }
}, {
    timestamps: true,
    indexes: [
        { fields: ['roomNumber'] },
        { fields: ['status'] },
        { fields: ['roomType'] },
        { fields: ['floor'] }
    ]
});

module.exports = Room;
