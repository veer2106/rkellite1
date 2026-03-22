const User = require('./User');
const Order = require('./Order');
const MenuItem = require('./MenuItem');
const MenuCategory = require('./MenuCategory');
const Customer = require('./Customer');
const Reservation = require('./Reservation');
const Schedule = require('./Schedule');
const Table = require('./Table');
const InventoryItem = require('./InventoryItem');
const InventoryDepletion = require('./InventoryDepletion');
const AuditLog = require('./AuditLog');
const Room = require('./Room');
const Booking = require('./Booking');

// Define associations
User.hasMany(Order, { foreignKey: 'userId', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Customer.hasMany(Order, { foreignKey: 'customerId', as: 'orders' });
Order.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

Customer.hasMany(Reservation, { foreignKey: 'customerId', as: 'reservations' });
Reservation.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

User.hasMany(Schedule, { foreignKey: 'userId', as: 'schedules' });
Schedule.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(AuditLog, { foreignKey: 'userId', as: 'auditLogs' });
AuditLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Table and Order associations
Table.hasOne(Order, { foreignKey: 'id', sourceKey: 'currentOrderId', as: 'currentOrder' });
Order.hasMany(Table, { foreignKey: 'currentOrderId', as: 'tables' });

// Room and Booking associations
Room.hasMany(Booking, { foreignKey: 'roomId', as: 'bookings' });
Booking.belongsTo(Room, { foreignKey: 'roomId', as: 'room' });

Customer.hasMany(Booking, { foreignKey: 'customerId', as: 'bookings' });
Booking.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

User.hasMany(Booking, { foreignKey: 'createdBy', as: 'bookingsCreated' });
Booking.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

InventoryItem.hasMany(InventoryDepletion, { foreignKey: 'inventoryItemId', as: 'depletions' });
InventoryDepletion.belongsTo(InventoryItem, { foreignKey: 'inventoryItemId', as: 'inventoryItem' });
InventoryDepletion.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = {
  User,
  Order,
  MenuItem,
  MenuCategory,
  Customer,
  Reservation,
  Schedule,
  Table,
  InventoryItem,
  InventoryDepletion,
  AuditLog,
  Room,
  Booking
};
