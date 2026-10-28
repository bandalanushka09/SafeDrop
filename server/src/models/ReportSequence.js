const mongoose = require('mongoose');

const reportSequenceSchema = new mongoose.Schema({
  year: { type: Number, unique: true },
  seq: { type: Number, default: 0 },
});

module.exports = mongoose.model('ReportSequence', reportSequenceSchema);
