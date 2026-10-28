const SystemSetting = require('../models/SystemSetting');
const { logAudit } = require('../services/auditService');

const getSettings = async (req, res, next) => {
  try {
    const settings = await SystemSetting.find();
    const settingsMap = {};
    settings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    // Provide sensible defaults if not yet seeded
    const defaults = {
      appName: 'SafeDrop',
      tagline: 'Safe Water. Healthy Villages.',
      contactEmail: 'contact@safedrop.org',
      supportPhone: '+1-800-555-WATER',
      allowPublicRegistration: true,
      requireVerificationForAlerts: true,
      alertRetentionDays: 90,
      systemNotice: '',
    };

    res.json({
      success: true,
      data: { ...defaults, ...settingsMap },
    });
  } catch (err) {
    next(err);
  }
};

const updateSettings = async (req, res, next) => {
  try {
    const updates = req.body;

    for (const [key, value] of Object.entries(updates)) {
      await SystemSetting.findOneAndUpdate(
        { key },
        { key, value, updatedBy: req.user._id },
        { upsert: true, new: true }
      );
    }

    await logAudit({
      actor: req.user,
      action: 'SYSTEM_SETTINGS_UPDATED',
      entityType: 'SystemSetting',
      entityId: 'global',
      safeMetadata: { updatedKeys: Object.keys(updates) },
    });

    res.json({
      success: true,
      message: 'System settings saved.',
      data: updates,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getSettings,
  updateSettings,
};

