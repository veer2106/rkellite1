const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const { sequelize } = require('./config/database');
const MenuCategory = require('./models/MenuCategory');
const InventoryDepletion = require('./models/InventoryDepletion');
const {
  User,
  Order,
  MenuItem,
  Customer,
  Reservation,
  Schedule,
  Table,
  InventoryItem,
  AuditLog,
  Room,
  Booking
} = require('./models');
const http = require('http');
const socketIo = require('socket.io');
const logger = require('./utils/logger');

// Load environment variables
dotenv.config();

logger.info('Starting RK Ellite Management System...', {
  nodeVersion: process.version,
  environment: process.env.NODE_ENV || 'development'
});

// Import routes
const authRoutes = require('./routes/authRoutes');
const orderRoutes = require('./routes/orderRoutes');
const menuRoutes = require('./routes/menuRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
const staffRoutes = require('./routes/staffRoutes');
const customerRoutes = require('./routes/customerRoutes');
const reportRoutes = require('./routes/reportRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes');
const auditRoutes = require('./routes/auditRoutes');
const tableRoutes = require('./routes/tableRoutes');
const roomRoutes = require('./routes/roomRoutes');
const bookingRoutes = require('./routes/bookingRoutes');

// Import audit logger middleware
const auditLogger = require('./middleware/auditLogger');

// Initialize app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Custom HTTP request logger
app.use(logger.httpLogger());

// Make io accessible to routes
app.set('io', io);

// Audit logging middleware (after auth but before routes)
app.use(auditLogger());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/bookings', bookingRoutes);

// Health check
app.get('/api/health', (req, res) => {
  logger.debug('Health check endpoint accessed');
  res.json({ status: 'OK', message: 'Restaurant Management System API' });
});

// Serve frontend static files (for Docker production)
const publicPath = path.join(__dirname, '..', 'public');
const { existsSync } = require('fs');
if (existsSync(publicPath)) {
  app.use(express.static(publicPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) return next();
    res.sendFile(path.join(publicPath, 'index.html'));
  });
}

// Socket.IO for real-time updates
io.on('connection', (socket) => {
  logger.info('Socket.IO client connected', { socketId: socket.id });

  socket.on('disconnect', () => {
    logger.info('Socket.IO client disconnected', { socketId: socket.id });
  });

  socket.on('joinTable', (tableId) => {
    socket.join(`table_${tableId}`);
    logger.debug('Client joined table room', { socketId: socket.id, tableId });
  });

  socket.on('joinKitchen', () => {
    socket.join('kitchen');
    logger.debug('Client joined kitchen room', { socketId: socket.id });
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.errorWithStack(err, {
    method: req.method,
    url: req.url,
    ip: req.ip || req.connection.remoteAddress,
    statusCode: err.status || 500
  });

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Database connection and server start
const PORT = process.env.PORT || 5001;

const startServer = async () => {
  try {
    // Test database connection
    logger.info('Connecting to database...');
    await sequelize.authenticate();
    logger.info('✓ Database connection established', {
      database: process.env.DB_NAME,
      host: process.env.DB_HOST
    });

    // Ensure required tables exist without altering existing schema.
    // This prevents runtime 500s on partially seeded databases.
    const syncModels = [
      User,
      Customer,
      MenuCategory,
      MenuItem,
      Table,
      Order,
      Reservation,
      Schedule,
      InventoryItem,
      InventoryDepletion,
      AuditLog,
      Room,
      Booking
    ];

    for (const model of syncModels) {
      await model.sync();
    }
    logger.info('✓ Required database tables verified');

    // Start server
    server.listen(PORT, () => {
      logger.info('✓ Server started successfully', {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000'
      });
    });
  } catch (error) {
    logger.errorWithStack(error, { context: 'Server startup failed' });
    process.exit(1);
  }
};

startServer();

module.exports = { app, io };
