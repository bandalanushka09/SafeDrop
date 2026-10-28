const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');

// Profile routes
router.get('/me', authenticate, userController.updateProfile);
router.patch('/me', authenticate, userController.updateProfile);

// Admin-only user management routes
router.get('/admin/users', authenticate, authorize('admin'), userController.listUsers);
router.get('/admin/users/:id', authenticate, authorize('admin'), userController.getUserById);
router.patch('/admin/users/:id', authenticate, authorize('admin'), userController.updateUserStatus);
router.patch('/admin/users/:id/role', authenticate, authorize('admin'), userController.updateUserRole);

module.exports = router;

