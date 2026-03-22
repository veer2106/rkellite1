const express = require('express');
const router = express.Router();
const {
  getStaff,
  getStaffMember,
  updateStaffMember,
  getSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getStaffPerformance
} = require('../controllers/staffController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Schedule routes (must come before /:id routes)
router.route('/schedules')
  .get(getSchedules)
  .post(authorize('admin', 'manager'), createSchedule);

router.route('/schedules/:id')
  .put(authorize('admin', 'manager'), updateSchedule)
  .delete(authorize('admin', 'manager'), deleteSchedule);

// Staff routes
router.get('/', authorize('admin', 'manager'), getStaff);
router.get('/:id', getStaffMember);
router.put('/:id', authorize('admin', 'manager'), updateStaffMember);
router.get('/:id/performance', authorize('admin', 'manager'), getStaffPerformance);

module.exports = router;
