const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');
const { publicReportLimiter } = require('../middleware/rateLimiter');

router.get('/', authenticate, authorize('health_worker', 'admin'), reportController.getReports);
router.get('/stats', authenticate, authorize('health_worker', 'admin'), reportController.getReportStats);
router.post('/', authenticate, reportController.createReport);
router.post('/public', optionalAuth, publicReportLimiter, reportController.createPublicReport);
router.get('/mine', authenticate, reportController.getMyReports);
router.get('/track', reportController.trackReport);
router.get('/duplicate-check', publicReportLimiter, reportController.checkDuplicate);
router.get('/:id/official-status', authenticate, authorize('health_worker', 'admin'), reportController.officialStatus);
router.post('/:id/official-submit', authenticate, authorize('health_worker', 'admin'), reportController.officialSubmit);
router.get('/:id', optionalAuth, reportController.getReportById);
router.patch('/:id/status', authenticate, authorize('health_worker', 'admin'), reportController.updateReportStatus);
router.put('/:id/status', authenticate, authorize('health_worker', 'admin'), reportController.updateReportStatus);
router.patch('/:id/assign', authenticate, authorize('health_worker', 'admin'), reportController.assignReport);
router.post('/:id/notes', authenticate, authorize('health_worker', 'admin'), reportController.addInternalNote);

module.exports = router;
