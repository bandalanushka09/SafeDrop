const AuditLog = require('../models/AuditLog');

const logAudit = async ({ actor, action, entityType, entityId, safeMetadata = {} }) => {
  try {
    const logEntry = new AuditLog({
      actorId: actor ? actor._id || actor.id : null,
      actorName: actor ? actor.name : 'System',
      actorRole: actor ? actor.role : 'system',
      action,
      entityType,
      entityId: String(entityId),
      safeMetadata,
    });
    await logEntry.save();
  } catch (err) {
    console.error('[AuditLog] Failed to record audit log:', err.message);
  }
};

module.exports = { logAudit };

