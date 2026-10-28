const mongoose = require('mongoose');
const { SOURCE_TYPES } = require('../utils/reportConstants');

const waterSourceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Water source name is required'],
      trim: true,
      maxlength: 120,
    },
    type: {
      type: String,
      required: [true, 'Source type is required'],
      enum: SOURCE_TYPES,
      default: 'hand_pump',
      index: true,
    },
    village: {
      type: String,
      required: [true, 'Village or locality is required'],
      trim: true,
      index: true,
    },
    taluka: {
      type: String,
      trim: true,
      default: '',
      index: true,
    },
    district: {
      type: String,
      trim: true,
      default: '',
      index: true,
    },
    state: {
      type: String,
      trim: true,
      default: '',
      index: true,
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    coordinates: {
      latitude: {
        type: Number,
        min: -90,
        max: 90,
      },
      longitude: {
        type: Number,
        min: -180,
        max: 180,
      },
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
      },
      coordinates: {
        type: [Number],
      },
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['active', 'under_inspection', 'temporarily_unavailable', 'deactivated'],
      default: 'active',
      index: true,
    },
    riskLevel: {
      type: String,
      enum: ['SAFE', 'WARNING', 'HIGH_RISK', 'UNKNOWN'],
      default: 'UNKNOWN',
      index: true,
    },
    capacity: {
      type: String,
      trim: true,
      default: '',
    },
    lastTestDate: {
      type: Date,
    },
    lastTestResult: {
      type: String,
      trim: true,
      default: '',
    },
    photoUrl: {
      type: String,
      default: '',
    },
    servingPopulation: {
      type: Number,
      min: 0,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    lastTestedAt: {
      type: Date,
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
    isDemo: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

waterSourceSchema.pre('save', function syncGeo(next) {
  if (this.coordinates?.latitude != null && this.coordinates?.longitude != null) {
    this.location = {
      type: 'Point',
      coordinates: [Number(this.coordinates.longitude), Number(this.coordinates.latitude)],
    };
  }
  if (this.lastTestedAt && !this.lastTestDate) {
    this.lastTestDate = this.lastTestedAt;
  }
  if (this.lastTestDate && !this.lastTestedAt) {
    this.lastTestedAt = this.lastTestDate;
  }
  next();
});

waterSourceSchema.index({ name: 'text', description: 'text', address: 'text', village: 'text' });
waterSourceSchema.index({ location: '2dsphere' });
waterSourceSchema.index({ state: 1, district: 1, riskLevel: 1, type: 1, status: 1 });

module.exports = mongoose.model('WaterSource', waterSourceSchema);
