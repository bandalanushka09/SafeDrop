const mongoose = require('mongoose');

const diseaseArticleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Article title is required'],
      trim: true,
      maxlength: 200,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    summary: {
      type: String,
      required: [true, 'Summary is required'],
      trim: true,
      maxlength: 500,
    },
    content: {
      type: String,
      required: [true, 'Article content is required'],
    },
    category: {
      type: String,
      enum: [
        'cholera',
        'typhoid',
        'diarrheal_illness',
        'water_storage',
        'water_treatment',
        'hygiene',
        'general',
      ],
      default: 'general',
      index: true,
    },
    language: {
      type: String,
      default: 'en',
      index: true,
    },
    transmissionInfo: {
      type: String,
      default: '',
    },
    preventionGuidance: {
      type: String,
      default: '',
    },
    warningSigns: {
      type: String,
      default: '',
    },
    references: [
      {
        type: String,
        trim: true,
      },
    ],
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
    publishedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'published',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('DiseaseArticle', diseaseArticleSchema);

