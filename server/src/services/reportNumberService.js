const ReportSequence = require('../models/ReportSequence');

const nextReportReference = async (date = new Date()) => {
  const year = date.getFullYear();
  const doc = await ReportSequence.findOneAndUpdate(
    { year },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  const padded = String(doc.seq).padStart(6, '0');
  return `SD-${year}-${padded}`;
};

module.exports = { nextReportReference };
