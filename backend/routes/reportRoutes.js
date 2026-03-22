const express = require('express');
const router = express.Router();
const {
  getSalesReport,
  getMenuReport,
  getInventoryReport,
  getInventoryDepletionReport,
  getCustomerReport,
  getDashboardStats
} = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication and admin/manager role
router.use(protect);
router.use(authorize('admin', 'manager', 'supervisor'));

router.get('/sales', getSalesReport);
router.get('/menu', getMenuReport);
router.get('/inventory', getInventoryReport);
router.get('/inventory-depletion', getInventoryDepletionReport);
router.get('/customers', getCustomerReport);
router.get('/dashboard', getDashboardStats);

module.exports = router;
