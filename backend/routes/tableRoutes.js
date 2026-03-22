const express = require('express');
const router = express.Router();
const {
    getTables,
    getTable,
    getTableAvailability,
    createTable,
    setupTables,
    updateTable,
    updateTableStatus,
    deleteTable,
    getTableConfig
} = require('../controllers/tableController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Public routes (for all authenticated users)
router.get('/', getTables);
router.get('/config', getTableConfig);
router.get('/availability/:section/:tableNumber', getTableAvailability);
router.get('/:id', getTable);

// Admin/Manager routes
router.post('/', authorize('admin', 'manager'), createTable);
router.post('/setup', authorize('admin', 'manager'), setupTables);
router.put('/:id/status', updateTableStatus);
router.put('/:id', authorize('admin', 'manager'), updateTable);
router.delete('/:id', authorize('admin', 'manager'), deleteTable);

module.exports = router;
