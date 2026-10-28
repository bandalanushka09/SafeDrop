const express = require('express');
const router = express.Router();
const settingController = require('../controllers/settingController');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');

router.get('/', optionalAuth, settingController.getSettings);
router.patch('/', authenticate, authorize('admin'), settingController.updateSettings);

module.exports = router;

