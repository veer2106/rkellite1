const express = require('express');
const router = express.Router();
const {
  getMenuItems,
  getMenuItem,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  updateAvailability
} = require('../controllers/menuController');
const {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/categoryController');
const { protect, authorize } = require('../middleware/auth');

router.get('/categories', getCategories);
router.post('/categories', protect, authorize('admin'), createCategory);
router.put('/categories/:id', protect, authorize('admin'), updateCategory);
router.delete('/categories/:id', protect, authorize('admin'), deleteCategory);

router.route('/')
  .get(getMenuItems)
  .post(protect, authorize('admin', 'manager'), createMenuItem);

router.route('/:id')
  .get(getMenuItem)
  .put(protect, authorize('admin', 'manager'), updateMenuItem)
  .delete(protect, authorize('admin', 'manager'), deleteMenuItem);

router.put('/:id/availability', protect, updateAvailability);

module.exports = router;
