const express = require('express');
const router = express.Router();
const governmentController = require('../controllers/governmentController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/configuration', authenticate, authorize('admin', 'health_worker'), governmentController.configuration);
router.post(
  '/submit-report',
  authenticate,
  authorize('admin', 'health_worker'),
  governmentController.submitReport
);
router.get(
  '/report-status/:id',
  authenticate,
  authorize('admin', 'health_worker'),
  governmentController.reportStatus
);
router.get(
  '/departments',
  authenticate,
  authorize('admin'),
  governmentController.listDepartments
);
router.post(
  '/departments',
  authenticate,
  authorize('admin'),
  governmentController.createDepartment
);
router.patch(
  '/departments/:id',
  authenticate,
  authorize('admin'),
  governmentController.updateDepartment
);
router.delete(
  '/departments/:id',
  authenticate,
  authorize('admin'),
  governmentController.deleteDepartment
);

module.exports = router;
