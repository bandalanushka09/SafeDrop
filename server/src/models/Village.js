const mongoose = require('mongoose');

const villageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    district: {
      type: String,
      default: 'Main District',
      trim: true,
    },
    population: {
      type: Number,
      default: 0,
    },
    primaryContact: {
      type: String,
      default: '',
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Village', villageSchema);

