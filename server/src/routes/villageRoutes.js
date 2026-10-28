const express = require('express');
const router = express.Router();
const villageController = require('../controllers/villageController');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');

router.get('/', optionalAuth, villageController.getVillages);
router.post('/', authenticate, authorize('admin'), villageController.createVillage);
router.delete('/:id', authenticate, authorize('admin'), villageController.deleteVillage);

module.exports = router;

