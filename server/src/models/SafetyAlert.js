const mongoose = require('mongoose');

const updateRecordSchema = new mongoose.Schema(
  {
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    note: {
      type: String,
      trim: true,
      required: true,
    },
  },
  { _id: false }
);

const safetyAlertSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Alert title is required'],
      trim: true,
      maxlength: 180,
    },
    message: {
      type: String,
      required: [true, 'Alert advisory message is required'],
      trim: true,
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
      index: true,
    },
    affectedSourceIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'WaterSource',
      },
    ],
    affectedVillage: {
      type: String,
      required: [true, 'Affected village or area is required'],
      trim: true,
      index: true,
    },
    recommendedAction: {
      type: String,
      required: [true, 'Recommended public action is required'],
      trim: true,
    },
    supportingReference: {
      type: String,
      trim: true,
      default: '',
    },
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'expired', 'closed'],
      default: 'draft',
      index: true,
    },
    publishedAt: {
      type: Date,
      index: true,
    },
    expiresAt: {
      type: Date,
      index: true,
    },
    closedAt: {
      type: Date,
    },
    updateHistory: [updateRecordSchema],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('SafetyAlert', safetyAlertSchema);

