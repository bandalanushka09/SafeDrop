const RiskRule = require('../models/RiskRule');
const RiskFlag = require('../models/RiskFlag');
const { logAudit } = require('../services/auditService');

const getRiskRules = async (req, res, next) => {
  try {
    const rules = await RiskRule.find().sort({ parameter: 1, severity: 1 });
    res.json({ success: true, data: rules });
  } catch (err) {
    next(err);
  }
};

const createRiskRule = async (req, res, next) => {
  try {
    const {
      parameter,
      parameterName,
      comparisonOperator,
      threshold,
      unit,
      severity,
      recommendation,
      explanationTemplate,
      reference,
      active,
    } = req.body;

    if (!parameter || !parameterName || !comparisonOperator || threshold === undefined || !unit || !recommendation) {
      return res.status(400).json({
        success: false,
        message: 'All core rule fields (parameter, name, operator, threshold, unit, recommendation) are required.',
      });
    }

    const rule = new RiskRule({
      parameter: parameter.toLowerCase().trim(),
      parameterName: parameterName.trim(),
      comparisonOperator,
      threshold: Number(threshold),
      unit: unit.trim(),
      severity: severity || 'warning',
      recommendation: recommendation.trim(),
      explanationTemplate: explanationTemplate ? explanationTemplate.trim() : undefined,
      reference: reference ? reference.trim() : 'WHO Guidelines for Drinking-water Quality',
      active: active !== undefined ? active : true,
      updatedBy: req.user._id,
    });

    await rule.save();

    await logAudit({
      actor: req.user,
      action: 'RISK_RULE_CREATED',
      entityType: 'RiskRule',
      entityId: rule._id,
      safeMetadata: { parameter: rule.parameter, threshold: rule.threshold },
    });

    res.status(201).json({
      success: true,
      message: 'Risk assessment rule created.',
      data: rule,
    });
  } catch (err) {
    next(err);
  }
};

const updateRiskRule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const rule = await RiskRule.findById(id);
    if (!rule) {
      return res.status(404).json({ success: false, message: 'Risk rule not found' });
    }

    if (updates.parameterName) rule.parameterName = updates.parameterName.trim();
    if (updates.comparisonOperator) rule.comparisonOperator = updates.comparisonOperator;
    if (updates.threshold !== undefined) rule.threshold = Number(updates.threshold);
    if (updates.unit) rule.unit = updates.unit.trim();
    if (updates.severity) rule.severity = updates.severity;
    if (updates.recommendation) rule.recommendation = updates.recommendation.trim();
    if (updates.explanationTemplate !== undefined) rule.explanationTemplate = updates.explanationTemplate.trim();
    if (updates.reference) rule.reference = updates.reference.trim();
    if (updates.active !== undefined) rule.active = updates.active;
    rule.updatedBy = req.user._id;

    await rule.save();

    await logAudit({
      actor: req.user,
      action: 'RISK_RULE_UPDATED',
      entityType: 'RiskRule',
      entityId: rule._id,
      safeMetadata: { updates: Object.keys(updates) },
    });

    res.json({
      success: true,
      message: 'Risk assessment rule updated.',
      data: rule,
    });
  } catch (err) {
    next(err);
  }
};

const getRiskFlags = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, severity, status, sourceId } = req.query;
    const query = {};

    if (severity) query.severity = severity;
    if (status) query.reviewStatus = status;
    if (sourceId) query.sourceId = sourceId;

    const skip = (Number(page) - 1) * Number(limit);
    const [flags, total] = await Promise.all([
      RiskFlag.find(query)
        .populate('sourceId', 'name type village address status')
        .populate('testId', 'testedAt testingMethod testerName')
        .populate('ruleId')
        .populate('reviewedBy', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      RiskFlag.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: flags,
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

const getRiskFlagById = async (req, res, next) => {
  try {
    const flag = await RiskFlag.findById(req.params.id)
      .populate('sourceId', 'name type village address coordinates status')
      .populate('testId')
      .populate('ruleId')
      .populate('reviewedBy', 'name email role');

    if (!flag) {
      return res.status(404).json({ success: false, message: 'Risk flag record not found' });
    }

    res.json({ success: true, data: flag });
  } catch (err) {
    next(err);
  }
};

const reviewRiskFlag = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reviewStatus, resolutionNotes } = req.body;

    const allowed = ['pending_review', 'acknowledged', 'investigating', 'resolved', 'dismissed'];
    if (!reviewStatus || !allowed.includes(reviewStatus)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${allowed.join(', ')}`,
      });
    }

    const flag = await RiskFlag.findById(id);
    if (!flag) {
      return res.status(404).json({ success: false, message: 'Risk flag not found' });
    }

    flag.reviewStatus = reviewStatus;
    if (resolutionNotes !== undefined) flag.resolutionNotes = resolutionNotes.trim();
    flag.reviewedBy = req.user._id;
    flag.reviewedAt = new Date();

    await flag.save();

    await logAudit({
      actor: req.user,
      action: 'RISK_FLAG_REVIEWED',
      entityType: 'RiskFlag',
      entityId: flag._id,
      safeMetadata: { reviewStatus, parameter: flag.parameter },
    });

    res.json({
      success: true,
      message: `Risk flag marked as ${reviewStatus.replace('_', ' ')}.`,
      data: flag,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getRiskRules,
  createRiskRule,
  updateRiskRule,
  getRiskFlags,
  getRiskFlagById,
  reviewRiskFlag,
};

