const express = require('express');
const router = express.Router();
const {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  addLoyaltyPoints,
  redeemLoyaltyPoints,
  getTopCustomers
} = require('../controllers/customerController');
const { protect, authorize } = require('../middleware/auth');

router.get('/stats/top', protect, getTopCustomers);

router.route('/')
  .get(protect, getCustomers)
  .post(protect, createCustomer);

router.route('/:id')
  .get(protect, getCustomer)
  .put(protect, updateCustomer)
  .delete(protect, authorize('admin'), deleteCustomer);

router.post('/:id/loyalty/add', protect, addLoyaltyPoints);
router.post('/:id/loyalty/redeem', protect, redeemLoyaltyPoints);

module.exports = router;
