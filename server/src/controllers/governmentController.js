const CommunityReport = require('../models/CommunityReport');
const GovernmentDepartment = require('../models/GovernmentDepartment');
const {
  submitReportToGovernment,
  getGovernmentReportStatus,
  isGovernmentApiConfigured,
  buildOfficialPayload,
} = require('../services/governmentReportingService');
const { logAudit } = require('../services/auditService');

const configuration = (req, res) => {
  res.json({
    success: true,
    data: { governmentApiConfigured: isGovernmentApiConfigured() },
  });
};

const submitReport = async (req, res, next) => {
  try {
    const report = await CommunityReport.findById(req.body.reportId || req.params.id)
      .populate('sourceId', 'name type')
      .populate('reporterId', 'name');
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    const result = await submitReportToGovernment(report);
    await logAudit({
      actor: req.user,
      action: result.submitted ? 'GOVERNMENT_REPORT_SUBMITTED' : 'GOVERNMENT_REPORT_PREPARED',
      entityType: 'CommunityReport',
      entityId: report._id,
      safeMetadata: { status: result.status, configured: result.configured },
    });

    res.json({
      success: true,
      message: result.message,
      data: {
        officialSubmissionStatus: report.officialSubmissionStatus,
        officialReferenceId: report.officialReferenceId,
        officialSubmittedAt: report.officialSubmittedAt,
        configured: result.configured,
        payload: result.payload,
      },
    });
  } catch (err) {
    next(err);
  }
};

const reportStatus = async (req, res, next) => {
  try {
    const result = await getGovernmentReportStatus(req.params.id);
    if (!result) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const listDepartments = async (req, res, next) => {
  try {
    const departments = await GovernmentDepartment.find().sort({ state: 1, departmentName: 1 });
    res.json({
      success: true,
      data: departments,
      meta: { governmentApiConfigured: isGovernmentApiConfigured() },
    });
  } catch (err) {
    next(err);
  }
};

const createDepartment = async (req, res, next) => {
  try {
    const department = await GovernmentDepartment.create({
      departmentName: req.body.departmentName,
      state: req.body.state || '',
      district: req.body.district || '',
      category: req.body.category,
      officialApiEndpoint: req.body.officialApiEndpoint || '',
      enabled: req.body.enabled !== false,
      contactInformation: req.body.contactInformation || '',
      notes: req.body.notes || '',
    });
    res.status(201).json({ success: true, data: department });
  } catch (err) {
    next(err);
  }
};

const updateDepartment = async (req, res, next) => {
  try {
    const department = await GovernmentDepartment.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }
    ['departmentName', 'state', 'district', 'category', 'officialApiEndpoint', 'contactInformation', 'notes'].forEach(
      (field) => {
        if (req.body[field] !== undefined) department[field] = req.body[field];
      }
    );
    if (req.body.enabled !== undefined) department.enabled = Boolean(req.body.enabled);
    await department.save();
    res.json({ success: true, data: department });
  } catch (err) {
    next(err);
  }
};

const deleteDepartment = async (req, res, next) => {
  try {
    const department = await GovernmentDepartment.findByIdAndDelete(req.params.id);
    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }
    res.json({ success: true, message: 'Department removed.' });
  } catch (err) {
    next(err);
  }
};

const previewPayload = async (req, res, next) => {
  try {
    const report = await CommunityReport.findById(req.params.id).populate('sourceId', 'name type');
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }
    res.json({
      success: true,
      data: buildOfficialPayload(report),
      meta: { governmentApiConfigured: isGovernmentApiConfigured() },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  configuration,
  submitReport,
  reportStatus,
  listDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  previewPayload,
};
