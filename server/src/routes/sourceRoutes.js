const express = require('express');
const router = express.Router();
const sourceController = require('../controllers/sourceController');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');

router.get('/', optionalAuth, sourceController.getWaterSources);
router.post('/', authenticate, authorize('health_worker', 'admin'), sourceController.createWaterSource);
router.get('/:id', optionalAuth, sourceController.getWaterSourceById);
router.patch('/:id', authenticate, authorize('health_worker', 'admin'), sourceController.updateWaterSource);
router.put('/:id', authenticate, authorize('health_worker', 'admin'), sourceController.updateWaterSource);
router.delete('/:id', authenticate, authorize('admin'), sourceController.deleteWaterSource);

module.exports = router;
