const express = require('express');
const router = express.Router();
const riskController = require('../controllers/riskController');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');

router.get('/rules', optionalAuth, riskController.getRiskRules);
router.post('/rules', authenticate, authorize('admin'), riskController.createRiskRule);
router.patch('/rules/:id', authenticate, authorize('admin'), riskController.updateRiskRule);

router.get('/flags', authenticate, authorize('health_worker', 'admin'), riskController.getRiskFlags);
router.get('/flags/:id', authenticate, authorize('health_worker', 'admin'), riskController.getRiskFlagById);
router.patch('/flags/:id/review', authenticate, authorize('health_worker', 'admin'), riskController.reviewRiskFlag);

module.exports = router;

