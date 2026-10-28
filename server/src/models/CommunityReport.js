const mongoose = require('mongoose');
const {
  REPORT_STATUSES,
  SOURCE_TYPES,
  OFFICIAL_STATUSES,
} = require('../utils/reportConstants');

const internalNoteSchema = new mongoose.Schema(
  {
    note: {
      type: String,
      required: true,
      trim: true,
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    authorName: {
      type: String,
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const statusHistorySchema = new mongoose.Schema(
  {
    from: String,
    to: String,
    actorName: String,
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    note: String,
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const communityReportSchema = new mongoose.Schema(
  {
    referenceId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    reporterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
      default: null,
    },
    isPublicSubmission: {
      type: Boolean,
      default: false,
      index: true,
    },
    fullName: { type: String, trim: true, default: '' },
    phone: { type: String, trim: true, default: '', index: true },
    email: { type: String, trim: true, lowercase: true, default: '' },

    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WaterSource',
      index: true,
      default: null,
    },
    waterSourceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WaterSource',
      default: null,
    },
    waterSourceType: {
      type: String,
      enum: [...SOURCE_TYPES, ''],
      default: '',
    },
    waterSourceName: { type: String, trim: true, default: '' },

    village: {
      type: String,
      required: [true, 'Village/Locality is required'],
      trim: true,
      index: true,
    },
    taluka: { type: String, trim: true, default: '' },
    district: { type: String, trim: true, default: '' },
    state: { type: String, trim: true, default: '' },
    address: { type: String, trim: true, default: '' },
    locationDescription: {
      type: String,
      trim: true,
      default: '',
    },
    coordinates: {
      latitude: Number,
      longitude: Number,
    },
    location: {
      type: { type: String, enum: ['Point'] },
      coordinates: { type: [Number] },
    },
    category: {
      type: String,
      enum: [
        'unusual_color',
        'unusual_odor',
        'visible_debris',
        'suspected_contamination',
        'damaged_infrastructure',
        'sewage_leakage',
        'supply_interruption',
        'illness_cluster',
        'other',
      ],
      index: true,
    },
    concerns: [{ type: String, trim: true }],
    description: {
      type: String,
      required: [true, 'Report description is required'],
      trim: true,
      minlength: 10,
      maxlength: 4000,
    },
    observedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    reportedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    photoUrl: {
      type: String,
      default: '',
    },
    imageUrls: [{ type: String }],
    status: {
      type: String,
      enum: [
        ...REPORT_STATUSES,
        'submitted',
        'under_review',
        'action_required',
        'resolved',
        'rejected',
      ],
      default: 'NEW',
      index: true,
    },
    officialSubmissionStatus: {
      type: String,
      enum: OFFICIAL_STATUSES,
      default: 'READY_FOR_OFFICIAL_SUBMISSION',
      index: true,
    },
    officialReferenceId: { type: String, trim: true, default: '' },
    officialPayload: { type: mongoose.Schema.Types.Mixed, default: null },
    officialSubmittedAt: { type: Date },
    officialLastError: { type: String, default: '' },
    assignedDepartment: { type: String, trim: true, default: '' },
    assignedDepartmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GovernmentDepartment',
      default: null,
    },
    assignedOfficer: { type: String, trim: true, default: '' },
    assignedReviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    routingCategory: { type: String, trim: true, default: '' },
    internalNotes: [internalNoteSchema],
    statusHistory: [statusHistorySchema],
    publicResponse: {
      type: String,
      trim: true,
      default: '',
    },
    resolutionDetails: {
      type: String,
      trim: true,
      default: '',
    },
    resolutionNotes: {
      type: String,
      trim: true,
      default: '',
    },
    resolvedAt: {
      type: Date,
    },
    duplicateWarning: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

communityReportSchema.pre('save', function syncGeo(next) {
  if (this.coordinates?.latitude != null && this.coordinates?.longitude != null) {
    this.location = {
      type: 'Point',
      coordinates: [Number(this.coordinates.longitude), Number(this.coordinates.latitude)],
    };
  }
  if (this.sourceId && !this.waterSourceId) {
    this.waterSourceId = this.sourceId;
  }
  if (this.waterSourceId && !this.sourceId) {
    this.sourceId = this.waterSourceId;
  }
  if (!this.reportedAt) this.reportedAt = this.createdAt || new Date();
  next();
});

communityReportSchema.index({ phone: 1, reportedAt: -1 });
communityReportSchema.index({ status: 1, reportedAt: -1 });
communityReportSchema.index({ location: '2dsphere' });
communityReportSchema.index({ state: 1, district: 1 });

module.exports = mongoose.model('CommunityReport', communityReportSchema);
