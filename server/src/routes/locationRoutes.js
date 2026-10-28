const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');
const { locationLimiter } = require('../middleware/rateLimiter');

router.get('/search', locationLimiter, locationController.search);
router.get('/reverse', locationLimiter, locationController.reverse);
router.get('/states', locationController.states);

module.exports = router;
