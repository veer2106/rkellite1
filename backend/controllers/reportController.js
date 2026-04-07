const {
  Order,
  MenuItem,
  Customer,
  InventoryItem,
  InventoryDepletion,
  SystemSetting,
  DayClose,
  User
} = require('../models');
const { Op, fn, col } = require('sequelize');
const { sequelize } = require('../config/database');

// @desc    Get sales report
// @route   GET /api/reports/sales
// @access  Private (Admin/Manager)
exports.getSalesReport = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;
    
    let where = {
      paymentStatus: 'paid',
      status: { [Op.ne]: 'cancelled' }
    };
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = new Date(startDate);
      if (endDate) where.createdAt[Op.lte] = new Date(endDate);
    }

    // Total revenue
    const totalRevenue = await Order.sum('total', { where });
    
    // Total orders
    const totalOrders = await Order.count({ where });
    
    // Average order value
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Revenue by order type
    const revenueByType = await Order.findAll({
      where,
      attributes: [
        'orderType',
        [fn('SUM', col('total')), 'revenue'],
        [fn('COUNT', col('id')), 'orders']
      ],
      group: ['orderType'],
      raw: true
    });

    // Revenue by payment method
    const revenueByPayment = await Order.findAll({
      where,
      attributes: [
        'paymentMethod',
        [fn('SUM', col('total')), 'revenue'],
        [fn('COUNT', col('id')), 'orders']
      ],
      group: ['paymentMethod'],
      raw: true
    });

    // Daily/Weekly/Monthly revenue trend
    let dateFormat;
    if (groupBy === 'day') {
      dateFormat = '%Y-%m-%d';
    } else if (groupBy === 'week') {
      dateFormat = '%Y-%W';
    } else {
      dateFormat = '%Y-%m';
    }

    const revenueTrend = await sequelize.query(
      `SELECT 
        TO_CHAR("createdAt", '${dateFormat}') as period,
        SUM(total) as revenue,
        COUNT(id) as orders
      FROM "Orders"
      WHERE "paymentStatus" = 'paid' 
        AND status != 'cancelled'
        ${startDate ? `AND "createdAt" >= '${startDate}'` : ''}
        ${endDate ? `AND "createdAt" <= '${endDate}'` : ''}
      GROUP BY period
      ORDER BY period`,
      { type: sequelize.QueryTypes.SELECT }
    );

    res.json({
      success: true,
      data: {
        summary: {
          totalRevenue: parseFloat(totalRevenue || 0).toFixed(2),
          totalOrders,
          avgOrderValue: parseFloat(avgOrderValue).toFixed(2)
        },
        revenueByType,
        revenueByPayment,
        revenueTrend
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get menu performance report
// @route   GET /api/reports/menu
// @access  Private (Admin/Manager)
exports.getMenuReport = async (req, res) => {
  try {
    const { startDate, endDate, limit = 10 } = req.query;
    
    let where = {
      paymentStatus: 'paid',
      status: { [Op.ne]: 'cancelled' }
    };
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = new Date(startDate);
      if (endDate) where.createdAt[Op.lte] = new Date(endDate);
    }

    // Get all orders
    const orders = await Order.findAll({ where });
    
    // Aggregate menu item sales
    const itemStats = {};
    
    orders.forEach(order => {
      order.items.forEach(item => {
        if (!itemStats[item.menuItemId]) {
          itemStats[item.menuItemId] = {
            menuItemId: item.menuItemId,
            name: item.name,
            quantity: 0,
            revenue: 0
          };
        }
        itemStats[item.menuItemId].quantity += item.quantity;
        itemStats[item.menuItemId].revenue += item.price * item.quantity;
      });
    });

    // Convert to array and sort
    const topItems = Object.values(itemStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, parseInt(limit));

    const leastPopular = Object.values(itemStats)
      .sort((a, b) => a.quantity - b.quantity)
      .slice(0, parseInt(limit));

    res.json({
      success: true,
      data: {
        topSellingItems: topItems,
        leastPopularItems: leastPopular,
        totalItemsSold: Object.values(itemStats).reduce((sum, item) => sum + item.quantity, 0)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get inventory report
// @route   GET /api/reports/inventory
// @access  Private (Admin/Manager)
exports.getInventoryReport = async (req, res) => {
  try {
    const items = await InventoryItem.findAll({
      where: { isActive: true }
    });

    const totalValue = items.reduce((sum, item) => 
      sum + (parseFloat(item.currentStock) * parseFloat(item.unitPrice || 0)), 0
    );

    const lowStockItems = items.filter(item => 
      parseFloat(item.currentStock) <= parseFloat(item.minStock)
    );

    const outOfStockItems = items.filter(item => 
      parseFloat(item.currentStock) === 0
    );

    const categoryBreakdown = items.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = {
          category: item.category,
          items: 0,
          value: 0
        };
      }
      acc[item.category].items++;
      acc[item.category].value += parseFloat(item.currentStock) * parseFloat(item.unitPrice || 0);
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        summary: {
          totalItems: items.length,
          totalValue: parseFloat(totalValue).toFixed(2),
          lowStockCount: lowStockItems.length,
          outOfStockCount: outOfStockItems.length
        },
        lowStockItems: lowStockItems.slice(0, 10),
        outOfStockItems,
        categoryBreakdown: Object.values(categoryBreakdown)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get inventory depletion report
// @route   GET /api/reports/inventory-depletion
// @access  Private (Admin/Manager/Supervisor)
exports.getInventoryDepletionReport = async (req, res) => {
  try {
    const { startDate, endDate, limit = 100 } = req.query;
    const where = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt[Op.lte] = end;
      }
    }

    const depletions = await InventoryDepletion.findAll({
      where,
      include: [
        { model: InventoryItem, as: 'inventoryItem', attributes: ['id', 'name', 'sku', 'category', 'unit'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit, 10) || 100
    });

    res.json({
      success: true,
      data: {
        depletions: depletions.map((d) => ({
          id: d.id,
          itemName: d.inventoryItem?.name,
          itemSku: d.inventoryItem?.sku,
          category: d.inventoryItem?.category,
          unit: d.inventoryItem?.unit,
          quantity: parseFloat(d.quantity),
          previousStock: parseFloat(d.previousStock),
          newStock: parseFloat(d.newStock),
          dateTime: d.createdAt
        })),
        totalCount: depletions.length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get customer report
// @route   GET /api/reports/customers
// @access  Private (Admin/Manager)
exports.getCustomerReport = async (req, res) => {
  try {
    const totalCustomers = await Customer.count({ where: { isActive: true } });
    
    const tierDistribution = await Customer.findAll({
      where: { isActive: true },
      attributes: [
        'loyaltyTier',
        [fn('COUNT', col('id')), 'count']
      ],
      group: ['loyaltyTier'],
      raw: true
    });

    const topCustomers = await Customer.findAll({
      where: { isActive: true },
      order: [['totalSpent', 'DESC']],
      limit: 10
    });

    const avgLoyaltyPoints = await Customer.findAll({
      where: { isActive: true },
      attributes: [
        [fn('AVG', col('loyaltyPoints')), 'avgPoints'],
        [fn('SUM', col('loyaltyPoints')), 'totalPoints']
      ],
      raw: true
    });

    res.json({
      success: true,
      data: {
        totalCustomers,
        tierDistribution,
        topCustomers,
        loyaltyStats: avgLoyaltyPoints[0]
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get dashboard statistics
// @route   GET /api/reports/dashboard
// @access  Private
exports.getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Today's stats
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

    // Yesterday's stats for comparison
    const yesterdayOrders = await Order.count({
      where: {
        createdAt: { [Op.gte]: yesterday, [Op.lt]: today },
        status: { [Op.ne]: 'cancelled' }
      }
    });

    const yesterdayRevenue = await Order.sum('total', {
      where: {
        createdAt: { [Op.gte]: yesterday, [Op.lt]: today },
        paymentStatus: 'paid'
      }
    });

    // Active orders
    const activeOrders = await Order.count({
      where: { status: { [Op.in]: ['pending', 'confirmed', 'preparing'] } }
    });

    // Low stock alerts
    const inventory = await InventoryItem.findAll({ where: { isActive: true } });
    const lowStockCount = inventory.filter(item => 
      parseFloat(item.currentStock) <= parseFloat(item.minStock)
    ).length;

    res.json({
      success: true,
      data: {
        today: {
          orders: todayOrders,
          revenue: parseFloat(todayRevenue || 0).toFixed(2)
        },
        yesterday: {
          orders: yesterdayOrders,
          revenue: parseFloat(yesterdayRevenue || 0).toFixed(2)
        },
        activeOrders,
        lowStockAlerts: lowStockCount
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

function formatLocalYmd(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function boundsForYmd(ymd) {
  if (!ymd || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
  const [y, m, d] = ymd.split('-').map(Number);
  const start = new Date(y, m - 1, d, 0, 0, 0, 0);
  const end = new Date(y, m - 1, d, 23, 59, 59, 999);
  return [start, end];
}

function aggregateOrdersForReport(orders) {
  let totalRevenue = 0;
  let subtotalSum = 0;
  let taxSum = 0;
  const byOrderType = {};
  const byPayment = {};
  for (const o of orders) {
    const t = parseFloat(o.total) || 0;
    const s = parseFloat(o.subtotal) || 0;
    const tx = parseFloat(o.tax) || 0;
    totalRevenue += t;
    subtotalSum += s;
    taxSum += tx;
    const ot = o.orderType || 'unknown';
    byOrderType[ot] = (byOrderType[ot] || 0) + t;
    const pm = o.paymentMethod || 'unknown';
    byPayment[pm] = (byPayment[pm] || 0) + t;
  }
  return {
    orderCount: orders.length,
    totalRevenue: parseFloat(totalRevenue.toFixed(2)),
    subtotalSum: parseFloat(subtotalSum.toFixed(2)),
    taxSum: parseFloat(taxSum.toFixed(2)),
    byOrderType,
    byPayment
  };
}

// @desc    List daily revenue (calendar days) + formal close flags
// @route   GET /api/reports/daily-revenue
// @access  Private (admin, manager, supervisor)
exports.listDailyRevenue = async (req, res) => {
  try {
    const days = Math.min(Math.max(parseInt(req.query.days, 10) || 90, 1), 366);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
    const since = new Date(today);
    since.setDate(since.getDate() - (days - 1));
    since.setHours(0, 0, 0, 0);

    const orders = await Order.findAll({
      where: {
        paymentStatus: 'paid',
        status: { [Op.ne]: 'cancelled' },
        createdAt: { [Op.between]: [since, endOfToday] }
      },
      attributes: ['total', 'createdAt']
    });

    const byDay = {};
    for (const o of orders) {
      const key = formatLocalYmd(new Date(o.createdAt));
      if (!byDay[key]) byDay[key] = { revenue: 0, orderCount: 0 };
      byDay[key].revenue += parseFloat(o.total || 0);
      byDay[key].orderCount += 1;
    }

    const sinceStr = formatLocalYmd(since);
    const closes = await DayClose.findAll({
      where: { businessDate: { [Op.gte]: sinceStr } },
      include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] }]
    });
    const closeByDate = {};
    closes.forEach((c) => {
      closeByDate[c.businessDate] = c;
    });

    const list = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = formatLocalYmd(d);
      const agg = byDay[key] || { revenue: 0, orderCount: 0 };
      const dc = closeByDate[key];
      list.push({
        date: key,
        revenue: parseFloat(agg.revenue.toFixed(2)),
        orderCount: agg.orderCount,
        formallyClosed: !!dc,
        closedAt: dc ? dc.closedAt : null,
        closedBy: dc?.user
          ? {
              id: dc.user.id,
              name: [dc.user.firstName, dc.user.lastName].filter(Boolean).join(' ') || dc.user.email
            }
          : null
      });
    }

    const posRow = await SystemSetting.findByPk('pos_accepting_orders');
    const posAcceptingOrders = !posRow || posRow.value !== 'false';

    res.json({
      success: true,
      data: {
        days: list,
        posAcceptingOrders
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    One day's revenue + all paid transactions
// @route   GET /api/reports/daily-revenue/:date  (YYYY-MM-DD)
// @access  Private (admin, manager, supervisor)
exports.getDailyRevenueDetail = async (req, res) => {
  try {
    const { date } = req.params;
    const bounds = boundsForYmd(date);
    if (!bounds) {
      return res.status(400).json({ success: false, message: 'Invalid date. Use YYYY-MM-DD.' });
    }
    const [start, end] = bounds;

    const dayOrders = await Order.findAll({
      where: {
        paymentStatus: 'paid',
        status: { [Op.ne]: 'cancelled' },
        createdAt: { [Op.between]: [start, end] }
      },
      attributes: [
        'id',
        'orderNumber',
        'createdAt',
        'total',
        'subtotal',
        'tax',
        'status',
        'paymentStatus',
        'paymentMethod',
        'orderType',
        'tableNumber',
        'section',
        'customerName'
      ],
      order: [['createdAt', 'ASC']]
    });

    const summary = aggregateOrdersForReport(dayOrders);
    const dayClose = await DayClose.findOne({
      where: { businessDate: date },
      include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] }]
    });

    res.json({
      success: true,
      data: {
        date,
        summary,
        orders: dayOrders.map((o) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          createdAt: o.createdAt,
          total: parseFloat(o.total || 0).toFixed(2),
          subtotal: parseFloat(o.subtotal || 0).toFixed(2),
          tax: parseFloat(o.tax || 0).toFixed(2),
          status: o.status,
          paymentStatus: o.paymentStatus,
          paymentMethod: o.paymentMethod,
          orderType: o.orderType,
          tableNumber: o.tableNumber,
          section: o.section,
          customerName: o.customerName
        })),
        dayClose: dayClose
          ? {
              closedAt: dayClose.closedAt,
              totalRevenue: parseFloat(dayClose.totalRevenue || 0).toFixed(2),
              orderCount: dayClose.orderCount,
              closedBy: dayClose.user
                ? {
                    id: dayClose.user.id,
                    name: [dayClose.user.firstName, dayClose.user.lastName].filter(Boolean).join(' ') || dayClose.user.email
                  }
                : null
            }
          : null
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Close business day: snapshot revenue, block new POS orders
// @route   POST /api/reports/day-close
// @access  Private (admin, manager)
exports.postDayClose = async (req, res) => {
  try {
    const dateStr = req.body.date || formatLocalYmd(new Date());
    const bounds = boundsForYmd(dateStr);
    if (!bounds) {
      return res.status(400).json({ success: false, message: 'Invalid date. Use YYYY-MM-DD.' });
    }
    const [start, end] = bounds;
    const force = !!req.body.force;

    const openOrders = await Order.count({
      where: {
        status: { [Op.in]: ['pending', 'confirmed', 'preparing', 'ready', 'served'] }
      }
    });

    if (openOrders > 0 && !force) {
      return res.status(400).json({
        success: false,
        message: `There are ${openOrders} open order(s) still in progress. Complete or cancel them before closing the day, or confirm with force: true.`,
        data: { openOrders }
      });
    }

    const dayOrders = await Order.findAll({
      where: {
        paymentStatus: 'paid',
        status: { [Op.ne]: 'cancelled' },
        createdAt: { [Op.between]: [start, end] }
      }
    });

    const summary = aggregateOrdersForReport(dayOrders);
    const breakdown = {
      byOrderType: summary.byOrderType,
      byPayment: summary.byPayment
    };

    const [record, created] = await DayClose.findOrCreate({
      where: { businessDate: dateStr },
      defaults: {
        closedAt: new Date(),
        userId: req.user.id,
        totalRevenue: summary.totalRevenue,
        orderCount: summary.orderCount,
        subtotalSum: summary.subtotalSum,
        taxSum: summary.taxSum,
        breakdown
      }
    });

    if (!created) {
      await record.update({
        closedAt: new Date(),
        userId: req.user.id,
        totalRevenue: summary.totalRevenue,
        orderCount: summary.orderCount,
        subtotalSum: summary.subtotalSum,
        taxSum: summary.taxSum,
        breakdown
      });
    }

    const [posRow] = await SystemSetting.findOrCreate({
      where: { key: 'pos_accepting_orders' },
      defaults: { value: 'true' }
    });
    await posRow.update({ value: 'false' });

    res.json({
      success: true,
      message: `Day ${dateStr} closed. POS no longer accepts new orders until the day is opened.`,
      data: {
        businessDate: dateStr,
        snapshot: summary,
        posAcceptingOrders: false
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Open business day: allow POS orders again
// @route   POST /api/reports/day-open
// @access  Private (admin, manager)
exports.postDayOpen = async (req, res) => {
  try {
    const [posRow] = await SystemSetting.findOrCreate({
      where: { key: 'pos_accepting_orders' },
      defaults: { value: 'true' }
    });
    await posRow.update({ value: 'true' });
    res.json({
      success: true,
      message: 'Day opened. POS accepts new orders.',
      data: { posAcceptingOrders: true }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
