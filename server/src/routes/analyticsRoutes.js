const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { optionalAuth } = require('../middleware/auth');

router.get('/summary', optionalAuth, analyticsController.getSummary);
router.get('/water-tests', optionalAuth, analyticsController.getWaterTestAnalytics);
router.get('/reports', optionalAuth, analyticsController.getReportAnalytics);
router.get('/alerts', optionalAuth, analyticsController.getAlertAnalytics);
router.get('/villages', optionalAuth, analyticsController.getVillageAnalytics);

module.exports = router;

