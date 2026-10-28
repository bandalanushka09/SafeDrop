const mongoose = require('mongoose');

const governmentDepartmentSchema = new mongoose.Schema(
  {
    departmentName: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      trim: true,
      default: '',
      index: true,
    },
    district: {
      type: String,
      trim: true,
      default: '',
    },
    category: {
      type: String,
      required: true,
      enum: ['water_supply', 'public_health', 'municipal', 'sanitation', 'other'],
      index: true,
    },
    officialApiEndpoint: {
      type: String,
      trim: true,
      default: '',
    },
    enabled: {
      type: Boolean,
      default: true,
      index: true,
    },
    contactInformation: {
      type: String,
      trim: true,
      default: '',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

governmentDepartmentSchema.index({ state: 1, district: 1, category: 1 });

module.exports = mongoose.model('GovernmentDepartment', governmentDepartmentSchema);
