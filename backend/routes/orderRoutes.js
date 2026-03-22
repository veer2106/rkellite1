const express = require('express');
const router = express.Router();
const {
  getOrders,
  getOrder,
  createOrder,
  updateOrder,
  updateOrderStatus,
  deleteOrder,
  getOrderStats,
  addItemsToOrder,
  getOrderForTable
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .get(protect, getOrders)
  .post(protect, createOrder);

router.get('/stats', protect, getOrderStats);
router.get('/by-table', protect, getOrderForTable);

router.post('/:id/add-items', protect, addItemsToOrder);

router.route('/:id')
  .get(protect, getOrder)
  .put(protect, updateOrder)
  .delete(protect, authorize('admin', 'manager'), deleteOrder);

router.put('/:id/status', protect, updateOrderStatus);

module.exports = router;
