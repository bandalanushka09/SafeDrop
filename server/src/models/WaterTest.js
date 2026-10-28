const mongoose = require('mongoose');

const testParameterSchema = new mongoose.Schema(
  {
    parameter: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    value: {
      type: Number,
      required: true,
    },
    unit: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const waterTestSchema = new mongoose.Schema(
  {
    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WaterSource',
      required: [true, 'Water source reference is required'],
      index: true,
    },
    testedAt: {
      type: Date,
      required: [true, 'Test date and time is required'],
      default: Date.now,
      index: true,
    },
    parameters: {
      type: [testParameterSchema],
      validate: [
        (val) => val && val.length > 0,
        'At least one test parameter measurement is required',
      ],
    },
    testingMethod: {
      type: String,
      enum: ['field_kit', 'laboratory', 'digital_probe', 'colorimetric', 'other'],
      default: 'field_kit',
    },
    laboratory: {
      type: String,
      trim: true,
      default: '',
    },
    testerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    testerName: {
      type: String,
      trim: true,
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'reviewed', 'verified', 'rejected'],
      default: 'pending',
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    attachmentUrl: {
      type: String,
      default: '',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
    reviewNotes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('WaterTest', waterTestSchema);

