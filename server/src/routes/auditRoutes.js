const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/audit-logs', authenticate, authorize('admin'), auditController.getAuditLogs);

module.exports = router;

