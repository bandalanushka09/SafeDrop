const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');

router.get('/', optionalAuth, alertController.getAlerts);
router.post('/', authenticate, authorize('health_worker', 'admin'), alertController.createAlert);
router.get('/:id', optionalAuth, alertController.getAlertById);
router.patch('/:id', authenticate, authorize('health_worker', 'admin'), alertController.updateAlert);
router.post('/:id/publish', authenticate, authorize('admin'), alertController.publishAlert);
router.post('/:id/close', authenticate, authorize('health_worker', 'admin'), alertController.closeAlert);

module.exports = router;

