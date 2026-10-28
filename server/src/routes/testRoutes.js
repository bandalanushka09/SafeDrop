const express = require('express');
const router = express.Router();
const testController = require('../controllers/testController');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');

router.get('/', optionalAuth, testController.getWaterTests);
router.post('/', authenticate, authorize('health_worker', 'admin'), testController.createWaterTest);
router.get('/:id', optionalAuth, testController.getWaterTestById);
router.patch('/:id', authenticate, authorize('health_worker', 'admin'), testController.updateWaterTest);
router.get('/source/:id', optionalAuth, testController.getTestsBySource);

module.exports = router;

