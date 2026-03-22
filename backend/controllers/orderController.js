const { Order, MenuItem, Customer, Table } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

// Helper function to calculate time spent in each state
const calculateOrderTimeline = (order) => {
  const timeline = {
    timestamps: {
      pending: order.pendingAt,
      confirmed: order.confirmedAt,
      preparing: order.preparingAt,
      ready: order.readyAt,
      served: order.servedAt,
      completed: order.completedAtTimestamp,
      cancelled: order.cancelledAt
    },
    durations: {},
    totalTime: null
  };

  // Calculate duration for each state (in minutes)
  if (order.confirmedAt && order.pendingAt) {
    timeline.durations.pendingTime = Math.round((new Date(order.confirmedAt) - new Date(order.pendingAt)) / 60000);
  }

  if (order.preparingAt && order.confirmedAt) {
    timeline.durations.confirmationTime = Math.round((new Date(order.preparingAt) - new Date(order.confirmedAt)) / 60000);
  }

  if (order.readyAt && order.preparingAt) {
    timeline.durations.preparationTime = Math.round((new Date(order.readyAt) - new Date(order.preparingAt)) / 60000);
  }

  if (order.servedAt && order.readyAt) {
    timeline.durations.waitingTime = Math.round((new Date(order.servedAt) - new Date(order.readyAt)) / 60000);
  }

  if (order.completedAtTimestamp && order.servedAt) {
    timeline.durations.serviceTime = Math.round((new Date(order.completedAtTimestamp) - new Date(order.servedAt)) / 60000);
  }

  // Calculate total time from pending to completed/cancelled
  const endTime = order.completedAtTimestamp || order.cancelledAt;
  if (endTime && order.pendingAt) {
    timeline.totalTime = Math.round((new Date(endTime) - new Date(order.pendingAt)) / 60000);
  }

  return timeline;
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private
exports.getOrders = async (req, res) => {
  try {
    const { status, orderType, section, startDate, endDate, page = 1, limit = 50 } = req.query;

    let where = {};

    if (status) where.status = status;
    if (orderType) where.orderType = orderType;
    if (section) where.section = section;

    // Section-based filtering for captains
    if (req.user.role === 'captain' && req.user.section) {
      where.section = req.user.section;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = new Date(startDate);
      if (endDate) where.createdAt[Op.lte] = new Date(endDate);
    }

    const offset = (page - 1) * limit;

    const orders = await Order.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: offset,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['firstName', 'lastName', 'email', 'phone'],
          required: false
        }
      ]
    });

    // Add timeline information to each order
    const ordersWithTimeline = orders.rows.map(order => {
      const orderData = order.toJSON();
      orderData.timeline = calculateOrderTimeline(order);
      return orderData;
    });

    res.json({
      success: true,
      count: orders.count,
      page: parseInt(page),
      pages: Math.ceil(orders.count / limit),
      data: ordersWithTimeline
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['firstName', 'lastName', 'email', 'phone'],
          required: false
        }
      ]
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Section-based access control for captains
    if (req.user.role === 'captain' && req.user.section) {
      if (order.section !== req.user.section) {
        return res.status(403).json({
          success: false,
          message: `Access denied. You can only access ${req.user.section} section orders.`
        });
      }
    }

    // Add timeline information
    const orderData = order.toJSON();
    orderData.timeline = calculateOrderTimeline(order);

    res.json({
      success: true,
      data: orderData
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
exports.createOrder = async (req, res) => {
  try {
    const {
      orderType,
      section,
      tableNumber,
      customerName,
      customerPhone,
      customerEmail,
      deliveryAddress,
      items,
      paymentMethod,
      notes
    } = req.body;

    // Section-based access control for captains
    if (req.user.role === 'captain' && req.user.section) {
      if (section && section !== req.user.section) {
        return res.status(403).json({
          success: false,
          message: `Access denied. You can only create orders for ${req.user.section} section.`
        });
      }
      // Force captain's section if not provided
      req.body.section = req.user.section;
    }

    // For dine-in orders with table numbers, check table availability
    if (orderType === 'dine-in' && tableNumber && req.body.section) {
      // Check if table exists and is available
      const existingTable = await Table.findOne({
        where: {
          section: req.body.section,
          tableNumber,
          isActive: true
        }
      });

      if (existingTable) {
        // Check if table is already occupied
        if (existingTable.status === 'occupied' && existingTable.currentOrderId) {
          // Check if the current order is still active
          const activeOrder = await Order.findOne({
            where: {
              id: existingTable.currentOrderId,
              status: {
                [Op.notIn]: ['completed', 'cancelled']
              }
            }
          });

          if (activeOrder) {
            return res.status(400).json({
              success: false,
              message: `Table ${tableNumber} in ${req.body.section} section is already occupied with order ${activeOrder.orderNumber}. Please choose another table or complete the existing order first.`
            });
          }
        }
      }
    }

    // Calculate order totals
    let subtotal = 0;
    for (const item of items) {
      const menuItem = await MenuItem.findByPk(item.menuItemId);
      if (!menuItem) {
        return res.status(404).json({ success: false, message: `Menu item ${item.menuItemId} not found` });
      }
      subtotal += parseFloat(menuItem.price) * item.quantity;
    }

    const tax = subtotal * 0.1; // 10% tax
    const deliveryFee = orderType === 'delivery' ? 5.00 : 0;
    const total = subtotal + tax + deliveryFee;

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const order = await Order.create({
      orderNumber,
      orderType,
      section,
      tableNumber,
      customerName,
      customerPhone,
      customerEmail,
      deliveryAddress,
      items,
      subtotal,
      tax,
      deliveryFee,
      total,
      paymentMethod,
      notes,
      userId: req.user.id,
      pendingAt: new Date() // Set initial timestamp
    });

    // If dine-in order with table, update table status and associate order
    if (orderType === 'dine-in' && tableNumber && section) {
      const [table] = await Table.findOrCreate({
        where: {
          section,
          tableNumber
        },
        defaults: {
          seats: 4,
          status: 'occupied',
          currentOrderId: order.id,
          isActive: true
        }
      });

      if (table) {
        await table.update({
          status: 'occupied',
          currentOrderId: order.id
        });
      }
    }

    logger.info('New order created', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      orderType: order.orderType,
      section: order.section,
      tableNumber: order.tableNumber,
      total: order.total,
      userId: req.user.id,
      itemCount: items.length
    });

    // Emit real-time update
    const io = req.app.get('io');
    io.emit('newOrder', order);
    io.to('kitchen').emit('newKitchenOrder', order);

    res.status(201).json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// @desc    Get current active order for a table (used when adding items to occupied table)
// @route   GET /api/orders/by-table
// @query   tableId OR section + tableNumber
// @access  Private
exports.getOrderForTable = async (req, res) => {
  try {
    const { section, tableNumber, tableId } = req.query;

    let table = null;

    if (tableId) {
      if (!UUID_REGEX.test(tableId)) {
        return res.status(400).json({ success: false, message: 'Invalid tableId' });
      }
      table = await Table.findByPk(tableId);
    } else if (section && tableNumber !== undefined && tableNumber !== '') {
      const tableNumStr = String(tableNumber).trim();
      table = await Table.findOne({
        where: {
          section,
          [Op.or]: [{ tableNumber: tableNumStr }, { tableNumber: tableNumber }],
          isActive: true
        }
      });
    }

    if (!table) {
      return res.status(404).json({ success: false, message: 'Table not found' });
    }

    const tableNumStr = String(table.tableNumber || '').trim();

    // Method 1: Via Table.currentOrderId
    if (table.currentOrderId) {
      const order = await Order.findByPk(table.currentOrderId);
      if (order && !['completed', 'cancelled'].includes(order.status)) {
        return res.json({ success: true, data: { orderId: order.id, order } });
      }
    }

    // Method 2: Find by section + tableNumber
    const orders = await Order.findAll({
      where: {
        orderType: 'dine-in',
        section: table.section,
        status: { [Op.notIn]: ['completed', 'cancelled'] }
      },
      order: [['createdAt', 'DESC']]
    });

    const order = orders.find(o =>
      String(o.tableNumber || '').trim() === tableNumStr || o.tableNumber === table.tableNumber
    );

    if (!order) {
      return res.status(404).json({ success: false, message: 'No active order found for this table' });
    }

    res.json({ success: true, data: { orderId: order.id, order } });
  } catch (error) {
    logger.error('getOrderForTable failed', { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add items to existing order (e.g. for occupied tables)
// @route   POST /api/orders/:id/add-items
// @access  Private
exports.addItemsToOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    if (!orderId || !UUID_REGEX.test(orderId)) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    const { items: newItems } = req.body;
    const order = await Order.findByPk(orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (!order.tableNumber || !['pending', 'confirmed', 'preparing', 'ready', 'served'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Can only add items to active dine-in orders (pending, confirmed, preparing, ready, or served)'
      });
    }

    if (!newItems || !Array.isArray(newItems) || newItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Items array is required and must not be empty'
      });
    }

    // Validate new items and merge with existing
    const existingItems = order.items || [];
    const itemMap = new Map();

    existingItems.forEach(item => {
      const key = item.menuItemId;
      itemMap.set(key, {
        menuItemId: item.menuItemId,
        name: item.name,
        price: parseFloat(item.price),
        quantity: (itemMap.get(key)?.quantity || 0) + (item.quantity || 0)
      });
    });

    for (const item of newItems) {
      const menuItem = await MenuItem.findByPk(item.menuItemId);
      if (!menuItem) {
        return res.status(404).json({ success: false, message: `Menu item ${item.menuItemId} not found` });
      }
      const key = item.menuItemId;
      const existing = itemMap.get(key);
      itemMap.set(key, {
        menuItemId: item.menuItemId,
        name: menuItem.name,
        price: parseFloat(menuItem.price),
        quantity: (existing?.quantity || 0) + (item.quantity || 0)
      });
    }

    const mergedItems = Array.from(itemMap.values());

    // Recalculate totals
    let subtotal = 0;
    for (const item of mergedItems) {
      subtotal += item.price * item.quantity;
    }
    const tax = subtotal * 0.1;
    const deliveryFee = order.orderType === 'delivery' ? parseFloat(order.deliveryFee || 0) : 0;
    const total = subtotal + tax + deliveryFee;

    await order.update({
      items: mergedItems,
      subtotal,
      tax,
      total
    });

    logger.info('Items added to order', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      addedCount: newItems.length,
      newTotal: total,
      userId: req.user.id
    });

    const io = req.app.get('io');
    io.emit('orderUpdated', order);
    io.to('kitchen').emit('newKitchenOrder', order);

    res.json({
      success: true,
      message: `Added ${newItems.length} item(s) to order ${order.orderNumber}`,
      data: order
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update order
// @route   PUT /api/orders/:id
// @access  Private
exports.updateOrder = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const updatedOrder = await order.update(req.body);

    logger.info('Order updated', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      updates: Object.keys(req.body),
      userId: req.user.id
    });

    // Emit real-time update
    const io = req.app.get('io');
    io.emit('orderUpdated', updatedOrder);

    res.json({
      success: true,
      data: updatedOrder
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByPk(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const previousStatus = order.status;
    order.status = status;

    // Update timestamp based on status
    const now = new Date();
    switch (status) {
      case 'pending':
        order.pendingAt = now;
        break;
      case 'confirmed':
        order.confirmedAt = now;
        break;
      case 'preparing':
        order.preparingAt = now;
        break;
      case 'ready':
        order.readyAt = now;
        break;
      case 'served':
        order.servedAt = now;
        break;
      case 'completed':
        order.completedAtTimestamp = now;
        order.completedAt = now; // Keep for backward compatibility
        order.paymentStatus = 'paid';
        break;
      case 'cancelled':
        order.cancelledAt = now;
        break;
    }

    if (status === 'completed') {
      order.paymentStatus = 'paid';

      // If dine-in order with table, free the table
      if (order.orderType === 'dine-in' && order.tableNumber && order.section) {
        const table = await Table.findOne({
          where: {
            section: order.section,
            tableNumber: order.tableNumber,
            currentOrderId: order.id
          }
        });

        if (table) {
          await table.update({
            status: 'available',
            currentOrderId: null
          });

          logger.info('Table freed', {
            tableId: table.id,
            tableNumber: table.tableNumber,
            section: table.section,
            orderId: order.id
          });
        }
      }
    }

    if (status === 'cancelled') {
      // If cancelled, also free the table
      if (order.orderType === 'dine-in' && order.tableNumber && order.section) {
        const table = await Table.findOne({
          where: {
            section: order.section,
            tableNumber: order.tableNumber,
            currentOrderId: order.id
          }
        });

        if (table) {
          await table.update({
            status: 'available',
            currentOrderId: null
          });

          logger.info('Table freed due to cancellation', {
            tableId: table.id,
            tableNumber: table.tableNumber,
            section: table.section,
            orderId: order.id
          });
        }
      }
    }

    await order.save();

    logger.info('Order status updated', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      previousStatus,
      newStatus: status,
      timestamp: now,
      userId: req.user?.id
    });

    // Emit real-time update
    const io = req.app.get('io');
    io.emit('orderStatusUpdated', order);
    if (order.tableNumber) {
      io.to(`table_${order.tableNumber}`).emit('orderUpdate', order);
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete order
// @route   DELETE /api/orders/:id
// @access  Private (Admin/Manager)
exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    await order.destroy();

    res.json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get order statistics
// @route   GET /api/orders/stats
// @access  Private
exports.getOrderStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayOrders = await Order.count({
      where: {
        createdAt: { [Op.gte]: today },
        status: { [Op.ne]: 'cancelled' }
      }
    });

    const todayRevenue = await Order.sum('total', {
      where: {
        createdAt: { [Op.gte]: today },
        paymentStatus: 'paid'
      }
    });

    const pendingOrders = await Order.count({
      where: { status: { [Op.in]: ['pending', 'confirmed', 'preparing'] } }
    });

    res.json({
      success: true,
      data: {
        todayOrders,
        todayRevenue: todayRevenue || 0,
        pendingOrders
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
