const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { logAudit } = require('../services/auditService');

const updateProfile = async (req, res, next) => {
  try {
    const { name, village, phoneNumber, preferredLanguage, currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+passwordHash');

    if (name) user.name = name.trim();
    if (village) user.village = village.trim();
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber.trim();
    if (preferredLanguage) user.preferredLanguage = preferredLanguage;

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password is required to set a new password.',
        });
      }
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Current password does not match our records.',
        });
      }
      if (newPassword.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'New password must be at least 8 characters long.',
        });
      }
      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(newPassword, salt);
    }

    await user.save();

    await logAudit({
      actor: req.user,
      action: 'PROFILE_UPDATED',
      entityType: 'User',
      entityId: user._id,
      safeMetadata: { passwordChanged: !!newPassword },
    });

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        village: user.village,
        phoneNumber: user.phoneNumber,
        preferredLanguage: user.preferredLanguage,
        accountStatus: user.accountStatus,
      },
    });
  } catch (err) {
    next(err);
  }
};

const listUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, village, status, search } = req.query;
    const query = {};

    if (role) query.role = role;
    if (village) query.village = village;
    if (status) query.accountStatus = status;

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      User.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: users,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)) || 1,
      },
    });
  } catch (err) {
    next(err);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { accountStatus } = req.body;

    if (!['active', 'suspended', 'deactivated'].includes(accountStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid account status' });
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Safety check: Prevent disabling the only active admin
    if (targetUser.role === 'admin' && accountStatus !== 'active') {
      const activeAdminCount = await User.countDocuments({ role: 'admin', accountStatus: 'active' });
      if (activeAdminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Operation prohibited: Cannot deactivate or suspend the final active administrator.',
        });
      }
    }

    const prevStatus = targetUser.accountStatus;
    targetUser.accountStatus = accountStatus;
    await targetUser.save();

    await logAudit({
      actor: req.user,
      action: 'USER_STATUS_UPDATED',
      entityType: 'User',
      entityId: targetUser._id,
      safeMetadata: { from: prevStatus, to: accountStatus, targetEmail: targetUser.email },
    });

    res.json({
      success: true,
      message: `User status changed to ${accountStatus}.`,
      data: targetUser,
    });
  } catch (err) {
    next(err);
  }
};

const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['villager', 'health_worker', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role specified' });
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Safety check: Prevent demoting the only admin
    if (targetUser.role === 'admin' && role !== 'admin') {
      const activeAdminCount = await User.countDocuments({ role: 'admin', accountStatus: 'active' });
      if (activeAdminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Operation prohibited: Cannot demote the final system administrator.',
        });
      }
    }

    const prevRole = targetUser.role;
    targetUser.role = role;
    await targetUser.save();

    await logAudit({
      actor: req.user,
      action: 'USER_ROLE_ASSIGNED',
      entityType: 'User',
      entityId: targetUser._id,
      safeMetadata: { from: prevRole, to: role, targetEmail: targetUser.email },
    });

    res.json({
      success: true,
      message: `User role updated to ${role}.`,
      data: targetUser,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  updateProfile,
  listUsers,
  getUserById,
  updateUserStatus,
  updateUserRole,
};

