const mongoose = require('mongoose');

const riskRuleSchema = new mongoose.Schema(
  {
    parameter: {
      type: String,
      required: [true, 'Parameter code is required'],
      trim: true,
      lowercase: true,
    },
    parameterName: {
      type: String,
      required: [true, 'Parameter human-readable name is required'],
      trim: true,
    },
    comparisonOperator: {
      type: String,
      required: true,
      enum: ['<', '<=', '>', '>=', '==', '!='],
    },
    threshold: {
      type: Number,
      required: [true, 'Evaluation threshold is required'],
    },
    unit: {
      type: String,
      required: true,
      trim: true,
    },
    severity: {
      type: String,
      required: true,
      enum: ['informational', 'warning', 'high_priority', 'critical_review'],
      default: 'warning',
    },
    recommendation: {
      type: String,
      required: true,
      trim: true,
    },
    explanationTemplate: {
      type: String,
      trim: true,
    },
    reference: {
      type: String,
      required: true,
      trim: true,
      default: 'WHO Guidelines for Drinking-water Quality',
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('RiskRule', riskRuleSchema);

