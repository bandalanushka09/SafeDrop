const mongoose = require('mongoose');

const riskFlagSchema = new mongoose.Schema(
  {
    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WaterSource',
      required: true,
      index: true,
    },
    testId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WaterTest',
      required: true,
      index: true,
    },
    ruleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RiskRule',
      required: true,
    },
    parameter: {
      type: String,
      required: true,
      trim: true,
    },
    parameterName: {
      type: String,
      trim: true,
    },
    measuredValue: {
      type: Number,
      required: true,
    },
    unit: {
      type: String,
      required: true,
    },
    threshold: {
      type: Number,
      required: true,
    },
    operator: {
      type: String,
      required: true,
    },
    severity: {
      type: String,
      enum: ['informational', 'warning', 'high_priority', 'critical_review'],
      default: 'warning',
      index: true,
    },
    explanation: {
      type: String,
      required: true,
    },
    recommendation: {
      type: String,
      required: true,
    },
    reviewStatus: {
      type: String,
      enum: ['pending_review', 'acknowledged', 'investigating', 'resolved', 'dismissed'],
      default: 'pending_review',
      index: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
    resolutionNotes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('RiskFlag', riskFlagSchema);

