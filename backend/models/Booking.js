const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Booking = sequelize.define('Booking', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    bookingNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    roomId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'Rooms',
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
    },
    guestName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    guestEmail: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
            isEmail: true
        }
    },
    guestPhone: {
        type: DataTypes.STRING,
        allowNull: false
    },
    guestAddress: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    numberOfGuests: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: {
            min: 1
        }
    },
    checkInDate: {
        type: DataTypes.DATE,
        allowNull: false
    },
    checkOutDate: {
        type: DataTypes.DATE,
        allowNull: false
    },
    actualCheckInTime: {
        type: DataTypes.DATE,
        allowNull: true
    },
    actualCheckOutTime: {
        type: DataTypes.DATE,
        allowNull: true
    },
    numberOfNights: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
    },
    pricePerNight: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    totalAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    advancePayment: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00
    },
    balanceAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    paymentStatus: {
        type: DataTypes.ENUM('pending', 'partial', 'paid', 'refunded'),
        defaultValue: 'pending'
    },
    paymentMethod: {
        type: DataTypes.ENUM('cash', 'card', 'upi', 'bank-transfer', 'other'),
        allowNull: true
    },
    bookingStatus: {
        type: DataTypes.ENUM('confirmed', 'checked-in', 'checked-out', 'cancelled', 'no-show'),
        defaultValue: 'confirmed'
    },
    specialRequests: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    idProofType: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Type of ID proof: Passport, Driving License, Aadhar, etc.'
    },
    idProofNumber: {
        type: DataTypes.STRING,
        allowNull: true
    },
    purpose: {
        type: DataTypes.ENUM('business', 'leisure', 'family', 'other'),
        defaultValue: 'leisure'
    },
    source: {
        type: DataTypes.ENUM('walk-in', 'phone', 'online', 'agent', 'other'),
        defaultValue: 'walk-in'
    },
    createdBy: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'Users',
            key: 'id'
        }
    },
    cancellationReason: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    cancelledAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    timestamps: true,
    indexes: [
        { fields: ['bookingNumber'] },
        { fields: ['roomId'] },
        { fields: ['customerId'] },
        { fields: ['bookingStatus'] },
        { fields: ['checkInDate'] },
        { fields: ['checkOutDate'] }
    ]
});

module.exports = Booking;
