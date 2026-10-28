const mongoose = require('mongoose');
const CommunityReport = require('../models/CommunityReport');
const WaterSource = require('../models/WaterSource');
const { createNotification, notifyRoleUsers } = require('../services/notificationService');
const { logAudit } = require('../services/auditService');
const { nextReportReference } = require('../services/reportNumberService');
const { routeReport } = require('../services/departmentRoutingService');
const { sendReportConfirmation } = require('../services/emailService');
const {
  submitReportToGovernment,
  isGovernmentApiConfigured,
  buildOfficialPayload,
} = require('../services/governmentReportingService');
const {
  REPORT_STATUSES,
  CONCERN_TO_CATEGORY,
  CONCERN_OPTIONS,
  normalizeStatus,
  statusQuery,
  INDIAN_PHONE_REGEX,
  EMAIL_REGEX,
  sanitizeText,
  OPEN_STATUSES,
  SOURCE_TYPES,
} = require('../utils/reportConstants');

const staffRoles = ['health_worker', 'admin'];

const publicTrackFields = [
  'referenceId',
  'status',
  'officialSubmissionStatus',
  'officialReferenceId',
  'village',
  'district',
  'taluka',
  'state',
  'waterSourceName',
  'waterSourceType',
  'concerns',
  'reportedAt',
  'createdAt',
  'publicResponse',
  'assignedDepartment',
  'resolvedAt',
];

const isHighPriority = (report) => {
  const concerns = report.concerns || [];
  return (
    concerns.includes('possible_disease_outbreak') ||
    concerns.includes('suspected_contamination') ||
    concerns.includes('unsafe_drinking_water') ||
    concerns.includes('dead_animal_near_water_source') ||
    report.category === 'illness_cluster'
  );
};

const findDuplicate = async ({ phone, sourceId, village }) => {
  const since = new Date(Date.now() - 48 * 60 * 60 * 1000);
  const query = {
    reportedAt: { $gte: since },
    phone: phone || undefined,
  };
  if (!phone) return null;
  if (sourceId) query.$or = [{ sourceId }, { waterSourceId: sourceId }];
  else query.village = village;
  return CommunityReport.findOne(query).sort({ reportedAt: -1 });
};

const buildCoordinates = (latitude, longitude) => {
  const coordinates = {};
  if (latitude !== undefined && latitude !== '' && !Number.isNaN(Number(latitude))) {
    coordinates.latitude = Number(latitude);
  }
  if (longitude !== undefined && longitude !== '' && !Number.isNaN(Number(longitude))) {
    coordinates.longitude = Number(longitude);
  }
  return Object.keys(coordinates).length ? coordinates : undefined;
};

const validatePublicInput = (body) => {
  const errors = [];
  const fullName = sanitizeText(body.fullName, 120);
  const phone = sanitizeText(body.phone, 20).replace(/\s+/g, '');
  const email = sanitizeText(body.email, 120).toLowerCase();
  const state = sanitizeText(body.state, 80);
  const district = sanitizeText(body.district, 80);
  const village = sanitizeText(body.village, 80);
  const address = sanitizeText(body.address || body.locationDescription, 300);
  const description = sanitizeText(body.description, 4000);
  const concerns = Array.isArray(body.concerns)
    ? body.concerns.map((c) => sanitizeText(c, 60)).filter(Boolean)
    : body.category
      ? [body.category]
      : [];
  const imageUrls = Array.isArray(body.imageUrls)
    ? body.imageUrls
    : body.photoUrl
      ? [body.photoUrl]
      : [];
  const hasLatitude = body.latitude !== undefined && body.latitude !== '';
  const hasLongitude = body.longitude !== undefined && body.longitude !== '';
  const latitude = hasLatitude ? Number(body.latitude) : undefined;
  const longitude = hasLongitude ? Number(body.longitude) : undefined;
  const sourceId = body.waterSourceId || body.sourceId;

  if (!fullName) errors.push('Full name is required.');
  const compactPhone = phone.replace(/[\s-]/g, '');
  const phoneOk =
    INDIAN_PHONE_REGEX.test(compactPhone) ||
    INDIAN_PHONE_REGEX.test(compactPhone.replace(/^91/, '+91')) ||
    /^[6-9]\d{9}$/.test(compactPhone);
  if (!phoneOk) errors.push('Enter a valid Indian mobile number.');
  if (!email || !EMAIL_REGEX.test(email)) errors.push('Enter a valid email address.');
  if (!state) errors.push('State is required.');
  if (!district) errors.push('District is required.');
  if (!village) errors.push('Village or city is required.');
  if (!address) errors.push('Full address is required.');
  if (!concerns.length) errors.push('Select at least one concern type.');
  if (concerns.some((concern) => !CONCERN_OPTIONS.some((option) => option.value === concern))) {
    errors.push('Select valid concern types.');
  }
  if (!description || description.length < 10) errors.push('Please describe the problem in at least 10 characters.');
  if (hasLatitude !== hasLongitude) errors.push('Provide both latitude and longitude, or leave both blank.');
  if (
    hasLatitude &&
    (!Number.isFinite(latitude) || latitude < -90 || latitude > 90)
  ) {
    errors.push('Enter a valid latitude between -90 and 90.');
  }
  if (
    hasLongitude &&
    (!Number.isFinite(longitude) || longitude < -180 || longitude > 180)
  ) {
    errors.push('Enter a valid longitude between -180 and 180.');
  }
  if (sourceId && !mongoose.Types.ObjectId.isValid(sourceId)) {
    errors.push('Select a valid registered water source.');
  }
  if (
    body.waterSourceType &&
    !SOURCE_TYPES.includes(sanitizeText(body.waterSourceType, 40))
  ) {
    errors.push('Select a valid water source type.');
  }
  if (
    imageUrls.length > 6 ||
    imageUrls.some(
      (imageUrl) =>
        typeof imageUrl !== 'string' ||
        !/^\/uploads\/safedrop-\d+-\d+\.(?:jpe?g|png|webp)$/i.test(imageUrl)
    )
  ) {
    errors.push('Only up to six photos uploaded to SafeDrop can be attached.');
  }

  return {
    errors,
    values: {
      fullName,
      phone: phone.replace(/[\s-]/g, ''),
      email,
      state,
      district,
      village,
      address,
      description,
      concerns,
      taluka: sanitizeText(body.taluka, 80),
      waterSourceName: sanitizeText(body.waterSourceName, 120),
      waterSourceType: sanitizeText(body.waterSourceType, 40),
      latitude,
      longitude,
      imageUrls,
    },
  };
};

const attachSourceDetails = async (body, fallbackVillage) => {
  const sourceId = body.waterSourceId || body.sourceId || null;
  let reportVillage = fallbackVillage;
  let extras = {};
  if (sourceId && mongoose.Types.ObjectId.isValid(sourceId)) {
    const src = await WaterSource.findById(sourceId);
    if (src) {
      extras = {
        sourceId: src._id,
        waterSourceId: src._id,
        waterSourceName: body.waterSourceName || src.name,
        waterSourceType: body.waterSourceType || src.type,
        village: reportVillage || src.village,
        taluka: body.taluka || src.taluka,
        district: body.district || src.district,
        state: body.state || src.state,
        address: body.address || src.address,
        coordinates:
          buildCoordinates(body.latitude, body.longitude) ||
          (src.coordinates?.latitude != null
            ? { latitude: src.coordinates.latitude, longitude: src.coordinates.longitude }
            : undefined),
      };
      reportVillage = extras.village;
    }
  }
  return { sourceId, reportVillage, extras };
};

const getReports = async (req, res, next) => {
  try {
    if (!req.user || !staffRoles.includes(req.user.role)) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to list reports.',
      });
    }

    const { page = 1, limit = 20, village, status, category, search, officialSubmissionStatus, concern } = req.query;
    const query = {};

    if (village) query.village = village;
    if (status) query.status = statusQuery(status);
    if (category) query.category = category;
    if (concern) query.concerns = concern;
    if (officialSubmissionStatus) query.officialSubmissionStatus = officialSubmissionStatus;

    if (search) {
      query.$or = [
        { description: { $regex: search, $options: 'i' } },
        { locationDescription: { $regex: search, $options: 'i' } },
        { village: { $regex: search, $options: 'i' } },
        { referenceId: { $regex: search, $options: 'i' } },
        { fullName: { $regex: search, $options: 'i' } },
        { waterSourceName: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [reports, total] = await Promise.all([
      CommunityReport.find(query)
        .populate('reporterId', 'name village role')
        .populate('sourceId', 'name type village riskLevel')
        .populate('assignedReviewer', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      CommunityReport.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: reports,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)) || 1,
      },
    });
  } catch (err) {
    next(err);
  }
};

const getReportStats = async (req, res, next) => {
  try {
    const [
      total,
      byStatus,
      highPriority,
      govPending,
      govConfirmed,
    ] = await Promise.all([
      CommunityReport.countDocuments(),
      CommunityReport.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      CommunityReport.countDocuments({
        concerns: {
          $in: [
            'possible_disease_outbreak',
            'suspected_contamination',
            'unsafe_drinking_water',
            'dead_animal_near_water_source',
          ],
        },
      }),
      CommunityReport.countDocuments({
        officialSubmissionStatus: { $in: ['READY_FOR_OFFICIAL_SUBMISSION', 'PREPARED', 'NOT_CONFIGURED'] },
      }),
      CommunityReport.countDocuments({ officialSubmissionStatus: { $in: ['CONFIRMED', 'SUBMITTED'] } }),
    ]);

    const counts = {
      NEW: 0,
      UNDER_REVIEW: 0,
      ASSIGNED: 0,
      IN_PROGRESS: 0,
      RESOLVED: 0,
      REJECTED: 0,
    };
    byStatus.forEach((row) => {
      const key = normalizeStatus(row._id);
      if (counts[key] !== undefined) counts[key] += row.count;
    });

    res.json({
      success: true,
      data: {
        total,
        ...counts,
        highPriority,
        governmentPending: govPending,
        governmentConfirmed: govConfirmed,
        governmentApiConfigured: isGovernmentApiConfigured(),
      },
    });
  } catch (err) {
    next(err);
  }
};

const getMyReports = async (req, res, next) => {
  try {
    const reports = await CommunityReport.find({
      $or: [{ reporterId: req.user._id }, { email: req.user.email }],
    })
      .populate('sourceId', 'name type village address')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: reports,
    });
  } catch (err) {
    next(err);
  }
};

const getReportById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isObjectId = mongoose.Types.ObjectId.isValid(id) && String(id).length === 24;
    const report = await CommunityReport.findOne(isObjectId ? { _id: id } : { referenceId: id })
      .populate('reporterId', 'name village')
      .populate('sourceId', 'name type village address coordinates status riskLevel')
      .populate('assignedReviewer', 'name email role')
      .populate('assignedDepartmentId');

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    const isOwner = req.user && String(report.reporterId?._id || '') === String(req.user._id);
    const isStaff = req.user && staffRoles.includes(req.user.role);

    if (!isOwner && !isStaff) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not have permission to view this report.',
      });
    }

    const obj = report.toObject();
    if (!isStaff) {
      delete obj.internalNotes;
      delete obj.statusHistory;
      delete obj.officialPayload;
    }

    res.json({
      success: true,
      data: obj,
    });
  } catch (err) {
    next(err);
  }
};

const trackReport = async (req, res, next) => {
  try {
    const referenceId = sanitizeText(req.query.referenceId || req.params.referenceId, 32).toUpperCase();
    const phone = sanitizeText(req.query.phone, 20).replace(/[\s-]/g, '');

    if (!referenceId) {
      return res.status(400).json({ success: false, message: 'Report reference number is required.' });
    }

    const query = { referenceId };
    if (phone) query.phone = phone;

    const report = await CommunityReport.findOne(query);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'No report was found for that reference number.',
      });
    }

    const publicData = {};
    publicTrackFields.forEach((field) => {
      publicData[field] = report[field];
    });
    publicData.highPriority = isHighPriority(report);
    publicData.concernLabels = (report.concerns || []).map(
      (value) => CONCERN_OPTIONS.find((opt) => opt.value === value)?.label || value
    );

    if (report.officialSubmissionStatus === 'CONFIRMED' || report.officialSubmissionStatus === 'SUBMITTED') {
      publicData.submissionNote = 'An official government reference has been recorded for this report.';
    } else {
      publicData.submissionNote =
        'This report has been recorded by SafeDrop and is ready for official submission. It has not been confirmed by a government department.';
    }

    res.json({ success: true, data: publicData });
  } catch (err) {
    next(err);
  }
};

const persistReport = async ({ body, user, isPublic }) => {
  const { extras, reportVillage } = await attachSourceDetails(
    body,
    sanitizeText(body.village, 80)
  );
  const concerns = Array.isArray(body.concerns) && body.concerns.length
    ? body.concerns
    : body.category
      ? [body.category]
      : [];
  const category = body.category || CONCERN_TO_CATEGORY[concerns[0]] || 'other';
  const routing = await routeReport({
    state: extras.state || body.state,
    district: extras.district || body.district,
    concerns,
  });

  const imageUrls = Array.isArray(body.imageUrls)
    ? body.imageUrls.filter(Boolean).slice(0, 6)
    : body.photoUrl
      ? [body.photoUrl]
      : [];

  const report = new CommunityReport({
    reporterId: user?._id || null,
    isPublicSubmission: Boolean(isPublic),
    fullName: sanitizeText(body.fullName || user?.name, 120),
    phone: sanitizeText(body.phone || user?.phoneNumber, 20),
    email: sanitizeText(body.email || user?.email, 120).toLowerCase(),
    village: extras.village || reportVillage,
    taluka: extras.taluka || sanitizeText(body.taluka, 80),
    district: extras.district || sanitizeText(body.district, 80),
    state: extras.state || sanitizeText(body.state, 80),
    address: extras.address || sanitizeText(body.address || body.locationDescription, 300),
    locationDescription: sanitizeText(body.locationDescription || body.address, 300),
    coordinates: extras.coordinates || buildCoordinates(body.latitude, body.longitude),
    sourceId: extras.sourceId || body.sourceId || null,
    waterSourceId: extras.waterSourceId || body.waterSourceId || body.sourceId || null,
    waterSourceName: extras.waterSourceName || sanitizeText(body.waterSourceName, 120),
    waterSourceType: extras.waterSourceType || sanitizeText(body.waterSourceType, 40) || 'unknown',
    category,
    concerns,
    description: sanitizeText(body.description, 4000),
    photoUrl: imageUrls[0] || '',
    imageUrls,
    observedAt: body.observedAt ? new Date(body.observedAt) : new Date(),
    reportedAt: new Date(),
    status: isPublic ? 'NEW' : 'submitted',
    officialSubmissionStatus: 'READY_FOR_OFFICIAL_SUBMISSION',
    assignedDepartment: routing.assignedDepartment,
    assignedDepartmentId: routing.assignedDepartmentId,
    routingCategory: routing.routingCategory,
  });

  report.referenceId = await nextReportReference(report.reportedAt);
  report.officialPayload = buildOfficialPayload(report);
  await report.save();
  return report;
};

const createPublicReport = async (req, res, next) => {
  try {
    if (req.body.website) {
      return res.status(201).json({
        success: true,
        message: 'Your report has been recorded by SafeDrop and is ready for official submission.',
      });
    }

    const { errors, values } = validatePublicInput(req.body);
    if (errors.length) {
      return res.status(400).json({
        success: false,
        message: errors[0],
        errors,
      });
    }

    if (values.waterSourceId || req.body.sourceId) {
      const sourceId = values.waterSourceId || req.body.sourceId;
      const sourceExists = await WaterSource.exists({ _id: sourceId, isArchived: false });
      if (!sourceExists) {
        return res.status(400).json({
          success: false,
          message: 'The selected water source could not be found. Select another source or report a general location.',
        });
      }
    }

    const duplicate = await findDuplicate({
      phone: values.phone,
      sourceId: req.body.waterSourceId || req.body.sourceId,
      village: values.village,
    });

    const report = await persistReport({
      body: { ...req.body, ...values },
      user: req.user || null,
      isPublic: true,
    });

    if (duplicate) {
      report.duplicateWarning = true;
      await report.save();
    }

    await notifyRoleUsers({
      roles: ['health_worker', 'admin'],
      village: report.village,
      title: `New public water concern: ${report.referenceId}`,
      message: `A public report was submitted in ${report.village}, ${report.state || ''}.`,
      type: 'report_status',
      relatedEntityType: 'report',
      relatedEntityId: report._id,
    });

    await logAudit({
      actor: req.user || { name: report.fullName, _id: null },
      action: 'PUBLIC_REPORT_SUBMITTED',
      entityType: 'CommunityReport',
      entityId: report._id,
      safeMetadata: { referenceId: report.referenceId, village: report.village },
    });

    const location = [report.village, report.district, report.state].filter(Boolean).join(', ');
    const concern = (report.concerns || []).join(', ');
    const statusMessage =
      'Your report has been recorded by SafeDrop and is ready for official submission.';
    await sendReportConfirmation({
      to: report.email,
      referenceId: report.referenceId,
      location,
      concern,
      statusMessage,
      trackUrl: `${process.env.PUBLIC_APP_URL || 'http://localhost:5173'}/track-report?ref=${report.referenceId}`,
    });

    res.status(201).json({
      success: true,
      message: statusMessage,
      duplicateWarning: Boolean(duplicate),
      duplicateMessage: duplicate
        ? 'A similar report was recently submitted for this water source. You can still submit your report if the issue is ongoing.'
        : undefined,
      data: {
        referenceId: report.referenceId,
        status: report.status,
        officialSubmissionStatus: report.officialSubmissionStatus,
        assignedDepartment: report.assignedDepartment,
        village: report.village,
        district: report.district,
        state: report.state,
        reportedAt: report.reportedAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

const createReport = async (req, res, next) => {
  try {
    const { category, description } = req.body;
    if (!category || !description) {
      return res.status(400).json({
        success: false,
        message: 'Category and description are required fields.',
      });
    }

    const report = await persistReport({
      body: {
        ...req.body,
        fullName: req.body.fullName || req.user.name,
        email: req.body.email || req.user.email,
        phone: req.body.phone || req.user.phoneNumber,
        village: req.body.village || req.user.village || 'Central District',
        address: req.body.address || req.body.locationDescription || req.user.village || 'Not specified',
        state: req.body.state || 'Maharashtra',
        district: req.body.district || 'Not specified',
        concerns: req.body.concerns || [category],
      },
      user: req.user,
      isPublic: false,
    });

    await notifyRoleUsers({
      roles: ['health_worker', 'admin'],
      village: report.village,
      title: `New Community Water Report: ${String(category).replace('_', ' ')}`,
      message: `A report has been submitted in ${report.village}: "${description.substring(0, 100)}..."`,
      type: 'report_status',
      relatedEntityType: 'report',
      relatedEntityId: report._id,
    });

    await logAudit({
      actor: req.user,
      action: 'COMMUNITY_REPORT_SUBMITTED',
      entityType: 'CommunityReport',
      entityId: report._id,
      safeMetadata: { category, village: report.village, referenceId: report.referenceId },
    });

    res.status(201).json({
      success: true,
      message: 'Your report has been submitted successfully. Community health workers have been notified.',
      data: report,
    });
  } catch (err) {
    next(err);
  }
};

const updateReportStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, publicResponse, resolutionDetails, resolutionNotes, assignedOfficer, assignedDepartment } =
      req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required.' });
    }
    const nextStatus = normalizeStatus(status);
    if (!REPORT_STATUSES.includes(nextStatus) && !['submitted', 'under_review', 'action_required', 'resolved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${REPORT_STATUSES.join(', ')}`,
      });
    }

    const report = await CommunityReport.findById(id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    const prevStatus = report.status;
    report.status = nextStatus;
    if (publicResponse !== undefined) report.publicResponse = publicResponse.trim();
    if (resolutionDetails !== undefined) report.resolutionDetails = resolutionDetails.trim();
    if (resolutionNotes !== undefined) report.resolutionNotes = resolutionNotes.trim();
    if (assignedOfficer !== undefined) report.assignedOfficer = assignedOfficer;
    if (assignedDepartment !== undefined) report.assignedDepartment = assignedDepartment;
    if (nextStatus === 'RESOLVED' || nextStatus === 'REJECTED') {
      report.resolvedAt = new Date();
    }
    report.statusHistory.push({
      from: prevStatus,
      to: nextStatus,
      actorName: req.user.name,
      actorId: req.user._id,
    });

    await report.save();

    if (report.reporterId) {
      await createNotification({
        userId: report.reporterId,
        title: `Report Status Updated: ${nextStatus.replace('_', ' ')}`,
        message: `Your water safety report from ${report.village} is now marked as "${nextStatus.replace(/_/g, ' ')}". ${
          publicResponse ? `Response: ${publicResponse}` : ''
        }`,
        type: 'report_status',
        relatedEntityType: 'report',
        relatedEntityId: report._id,
      });
    }

    await logAudit({
      actor: req.user,
      action: 'REPORT_STATUS_CHANGED',
      entityType: 'CommunityReport',
      entityId: report._id,
      safeMetadata: { from: prevStatus, to: nextStatus },
    });

    res.json({
      success: true,
      message: `Report status updated to ${nextStatus}.`,
      data: report,
    });
  } catch (err) {
    next(err);
  }
};

const assignReport = async (req, res, next) => {
  try {
    const { reviewerId, assignedOfficer, assignedDepartment } = req.body;
    const report = await CommunityReport.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    if (reviewerId) report.assignedReviewer = reviewerId;
    if (assignedOfficer) report.assignedOfficer = assignedOfficer;
    if (assignedDepartment) report.assignedDepartment = assignedDepartment;
    if (['NEW', 'submitted'].includes(report.status)) {
      report.status = 'ASSIGNED';
    }
    report.statusHistory.push({
      from: report.status,
      to: report.status,
      actorName: req.user.name,
      actorId: req.user._id,
      note: 'Assignment updated',
    });
    await report.save();

    await logAudit({
      actor: req.user,
      action: 'REPORT_ASSIGNED',
      entityType: 'CommunityReport',
      entityId: report._id,
      safeMetadata: { assignedReviewer: reviewerId, assignedOfficer },
    });

    res.json({
      success: true,
      message: 'Report assigned successfully.',
      data: report,
    });
  } catch (err) {
    next(err);
  }
};

const addInternalNote = async (req, res, next) => {
  try {
    const { note } = req.body;
    if (!note || !note.trim()) {
      return res.status(400).json({ success: false, message: 'Note text cannot be empty' });
    }

    const report = await CommunityReport.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    report.internalNotes.push({
      note: note.trim(),
      authorId: req.user._id,
      authorName: req.user.name,
      createdAt: new Date(),
    });
    await report.save();

    res.json({
      success: true,
      message: 'Internal review note added.',
      data: report.internalNotes,
    });
  } catch (err) {
    next(err);
  }
};

const officialSubmit = async (req, res, next) => {
  try {
    const report = await CommunityReport.findById(req.params.id).populate('sourceId', 'name type');
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }
    const result = await submitReportToGovernment(report);
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

const officialStatus = async (req, res, next) => {
  try {
    const report = await CommunityReport.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }
    res.json({
      success: true,
      data: {
        officialSubmissionStatus: report.officialSubmissionStatus,
        officialReferenceId: report.officialReferenceId,
        officialSubmittedAt: report.officialSubmittedAt,
        configured: isGovernmentApiConfigured(),
      },
    });
  } catch (err) {
    next(err);
  }
};

const checkDuplicate = async (req, res, next) => {
  try {
    const duplicate = await findDuplicate({
      phone: req.query.phone,
      sourceId: req.query.sourceId || req.query.waterSourceId,
      village: req.query.village,
    });
    res.json({
      success: true,
      data: {
        hasDuplicate: Boolean(duplicate),
        message: duplicate
          ? 'A similar report was recently submitted for this water source. You can still submit your report if the issue is ongoing.'
          : '',
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getReports,
  getReportStats,
  getMyReports,
  getReportById,
  createReport,
  createPublicReport,
  updateReportStatus,
  assignReport,
  addInternalNote,
  trackReport,
  officialSubmit,
  officialStatus,
  checkDuplicate,
  OPEN_STATUSES,
};
