const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const auditController = require('../controllers/auditController');

// All routes require authentication
router.use(protect);

// @route   GET /api/audit
// @desc    Get all audit logs with filtering
router.get('/', auditController.getAuditLogs);

// @route   GET /api/audit/stats
// @desc    Get audit statistics
router.get('/stats', auditController.getAuditStats);

// @route   GET /api/audit/:id
// @desc    Get audit log by ID
router.get('/:id', auditController.getAuditLogById);

module.exports = router;
