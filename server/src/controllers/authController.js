const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { logAudit } = require('../services/auditService');
const JWT_SECRET = require('../config/jwtSecret');
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      name: user.name,
      email: user.email,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

const register = async (req, res, next) => {
  try {
    const { name, email, password, village, phoneNumber, preferredLanguage } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required fields.',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long.',
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Public registration is restricted to 'villager' role only
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role: 'villager',
      village: village ? village.trim() : 'Central District',
      phoneNumber: phoneNumber ? phoneNumber.trim() : '',
      preferredLanguage: preferredLanguage || 'en',
      accountStatus: 'active',
      lastLoginAt: new Date(),
    });

    await user.save();

    await logAudit({
      actor: user,
      action: 'USER_REGISTERED',
      entityType: 'User',
      entityId: user._id,
      safeMetadata: { email: user.email, role: user.role },
    });

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        village: user.village,
        preferredLanguage: user.preferredLanguage,
        accountStatus: user.accountStatus,
      },
    });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+passwordHash');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials.',
      });
    }

    if (user.accountStatus !== 'active') {
      return res.status(403).json({
        success: false,
        message: `Your account is ${user.accountStatus}. Please contact support or administration.`,
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials.',
      });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = generateToken(user);

    await logAudit({
      actor: user,
      action: 'USER_LOGIN',
      entityType: 'User',
      entityId: user._id,
      safeMetadata: { email: user.email },
    });

    res.json({
      success: true,
      message: 'Signed in successfully.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        village: user.village,
        preferredLanguage: user.preferredLanguage,
        accountStatus: user.accountStatus,
      },
    });
  } catch (err) {
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    if (req.user) {
      await logAudit({
        actor: req.user,
        action: 'USER_LOGOUT',
        entityType: 'User',
        entityId: req.user._id,
      });
    }
    res.json({
      success: true,
      message: 'Signed out successfully.',
    });
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        village: user.village,
        phoneNumber: user.phoneNumber,
        preferredLanguage: user.preferredLanguage,
        accountStatus: user.accountStatus,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  logout,
  getMe,
};
