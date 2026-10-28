const SafetyAlert = require('../models/SafetyAlert');
const { notifyRoleUsers } = require('../services/notificationService');
const { logAudit } = require('../services/auditService');

const getAlerts = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, severity, village, isPublic } = req.query;
    const query = {};

    const isStaff = req.user && ['health_worker', 'admin'].includes(req.user.role);

    // If unauthenticated or villager, only return active published alerts
    if (!isStaff || isPublic === 'true') {
      query.status = 'published';
      query.$or = [{ expiresAt: { $exists: false } }, { expiresAt: null }, { expiresAt: { $gt: new Date() } }];
    } else if (status) {
      query.status = status;
    }

    if (severity) query.severity = severity;
    if (village) query.affectedVillage = village;

    const skip = (Number(page) - 1) * Number(limit);
    const [alerts, total] = await Promise.all([
      SafetyAlert.find(query)
        .populate('issuedBy', 'name role')
        .populate('affectedSourceIds', 'name type village')
        .sort({ publishedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      SafetyAlert.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: alerts,
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

const getAlertById = async (req, res, next) => {
  try {
    const alert = await SafetyAlert.findById(req.params.id)
      .populate('issuedBy', 'name role email')
      .populate('affectedSourceIds', 'name type village address coordinates status');

    if (!alert) {
      return res.status(404).json({ success: false, message: 'Safety alert not found' });
    }

    res.json({ success: true, data: alert });
  } catch (err) {
    next(err);
  }
};

const createAlert = async (req, res, next) => {
  try {
    const {
      title,
      message,
      severity,
      affectedSourceIds,
      affectedVillage,
      recommendedAction,
      supportingReference,
      expiresAt,
      publishImmediately,
    } = req.body;

    if (!title || !message || !affectedVillage || !recommendedAction) {
      return res.status(400).json({
        success: false,
        message: 'Title, message, affected village, and recommended action are required.',
      });
    }

    const canPublish = req.user.role === 'admin';
    const status = canPublish && publishImmediately ? 'published' : 'draft';

    const alert = new SafetyAlert({
      title: title.trim(),
      message: message.trim(),
      severity: severity || 'medium',
      affectedSourceIds: Array.isArray(affectedSourceIds) ? affectedSourceIds : [],
      affectedVillage: affectedVillage.trim(),
      recommendedAction: recommendedAction.trim(),
      supportingReference: supportingReference ? supportingReference.trim() : '',
      issuedBy: req.user._id,
      status,
      publishedAt: status === 'published' ? new Date() : undefined,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      updateHistory: [
        {
          updatedBy: req.user._id,
          updatedAt: new Date(),
          note: `Created initial alert as ${status}`,
        },
      ],
    });

    await alert.save();

    if (status === 'published') {
      await notifyRoleUsers({
        roles: ['villager', 'health_worker', 'admin'],
        village: alert.affectedVillage,
        title: `Water Safety Advisory: ${alert.title}`,
        message: `${alert.message.substring(0, 120)}... Recommended action: ${alert.recommendedAction}`,
        type: 'safety_alert',
        relatedEntityType: 'alert',
        relatedEntityId: alert._id,
      });
    }

    await logAudit({
      actor: req.user,
      action: 'SAFETY_ALERT_CREATED',
      entityType: 'SafetyAlert',
      entityId: alert._id,
      safeMetadata: { status, severity: alert.severity, village: alert.affectedVillage },
    });

    res.status(201).json({
      success: true,
      message: `Safety alert saved as ${status}.`,
      data: alert,
    });
  } catch (err) {
    next(err);
  }
};

const updateAlert = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const alert = await SafetyAlert.findById(id);
    if (!alert) {
      return res.status(404).json({ success: false, message: 'Safety alert not found' });
    }

    if (updates.title) alert.title = updates.title.trim();
    if (updates.message) alert.message = updates.message.trim();
    if (updates.severity) alert.severity = updates.severity;
    if (updates.affectedVillage) alert.affectedVillage = updates.affectedVillage.trim();
    if (updates.recommendedAction) alert.recommendedAction = updates.recommendedAction.trim();
    if (updates.supportingReference !== undefined) alert.supportingReference = updates.supportingReference.trim();
    if (updates.expiresAt !== undefined) alert.expiresAt = updates.expiresAt ? new Date(updates.expiresAt) : null;
    if (Array.isArray(updates.affectedSourceIds)) alert.affectedSourceIds = updates.affectedSourceIds;

    alert.updateHistory.push({
      updatedBy: req.user._id,
      updatedAt: new Date(),
      note: updates.updateNote || 'Alert details modified',
    });

    await alert.save();

    await logAudit({
      actor: req.user,
      action: 'SAFETY_ALERT_UPDATED',
      entityType: 'SafetyAlert',
      entityId: alert._id,
      safeMetadata: { updates: Object.keys(updates) },
    });

    res.json({
      success: true,
      message: 'Safety alert updated successfully.',
      data: alert,
    });
  } catch (err) {
    next(err);
  }
};

const publishAlert = async (req, res, next) => {
  try {
    const { id } = req.params;
    const alert = await SafetyAlert.findById(id);
    if (!alert) {
      return res.status(404).json({ success: false, message: 'Safety alert not found' });
    }

    alert.status = 'published';
    alert.publishedAt = new Date();
    alert.updateHistory.push({
      updatedBy: req.user._id,
      updatedAt: new Date(),
      note: 'Alert officially published to community.',
    });

    await alert.save();

    // Broadcast notification
    await notifyRoleUsers({
      roles: ['villager', 'health_worker', 'admin'],
      village: alert.affectedVillage,
      title: `Water Safety Advisory: ${alert.title}`,
      message: `${alert.message} Recommended action: ${alert.recommendedAction}`,
      type: 'safety_alert',
      relatedEntityType: 'alert',
      relatedEntityId: alert._id,
    });

    await logAudit({
      actor: req.user,
      action: 'SAFETY_ALERT_PUBLISHED',
      entityType: 'SafetyAlert',
      entityId: alert._id,
      safeMetadata: { severity: alert.severity, village: alert.affectedVillage },
    });

    res.json({
      success: true,
      message: 'Safety alert has been published to the community.',
      data: alert,
    });
  } catch (err) {
    next(err);
  }
};

const closeAlert = async (req, res, next) => {
  try {
    const { id } = req.params;
    const alert = await SafetyAlert.findById(id);
    if (!alert) {
      return res.status(404).json({ success: false, message: 'Safety alert not found' });
    }

    alert.status = 'closed';
    alert.closedAt = new Date();
    alert.updateHistory.push({
      updatedBy: req.user._id,
      updatedAt: new Date(),
      note: req.body.closeReason || 'Advisory closed by staff',
    });

    await alert.save();

    await logAudit({
      actor: req.user,
      action: 'SAFETY_ALERT_CLOSED',
      entityType: 'SafetyAlert',
      entityId: alert._id,
    });

    res.json({
      success: true,
      message: 'Safety alert marked as closed.',
      data: alert,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAlerts,
  getAlertById,
  createAlert,
  updateAlert,
  publishAlert,
  closeAlert,
};

