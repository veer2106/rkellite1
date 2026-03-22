const express = require('express');
const router = express.Router();
const {
  getInventoryItems,
  getInventoryItem,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  restockItem,
  depleteItem,
  consumeItem,
  getLowStockItems
} = require('../controllers/inventoryController');
const { protect, authorize } = require('../middleware/auth');

router.get('/alerts/low-stock', protect, getLowStockItems);

router.route('/')
  .get(protect, getInventoryItems)
  .post(protect, authorize('admin', 'manager'), createInventoryItem);

router.route('/:id')
  .get(protect, getInventoryItem)
  .put(protect, authorize('admin', 'manager'), updateInventoryItem)
  .delete(protect, authorize('admin', 'manager'), deleteInventoryItem);

router.post('/:id/restock', protect, restockItem);
router.post('/:id/deplete', protect, authorize('admin', 'manager', 'supervisor'), depleteItem);
router.post('/:id/consume', protect, consumeItem);

module.exports = router;
