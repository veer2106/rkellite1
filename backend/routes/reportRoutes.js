const express = require('express');
const router = express.Router();
const {
  getSalesReport,
  getMenuReport,
  getInventoryReport,
  getInventoryDepletionReport,
  getCustomerReport,
  getDashboardStats,
  listDailyRevenue,
  getDailyRevenueDetail,
  postDayClose,
  postDayOpen
} = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.post('/day-close', authorize('admin', 'manager'), postDayClose);
router.post('/day-open', authorize('admin', 'manager'), postDayOpen);

router.use(authorize('admin', 'manager', 'supervisor'));

router.get('/daily-revenue', listDailyRevenue);
router.get('/daily-revenue/:date', getDailyRevenueDetail);
router.get('/sales', getSalesReport);
router.get('/menu', getMenuReport);
router.get('/inventory', getInventoryReport);
router.get('/inventory-depletion', getInventoryDepletionReport);
router.get('/customers', getCustomerReport);
router.get('/dashboard', getDashboardStats);

module.exports = router;
