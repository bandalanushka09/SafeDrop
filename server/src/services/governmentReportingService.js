const CommunityReport = require('../models/CommunityReport');
const { CONCERN_OPTIONS } = require('../utils/reportConstants');

const isGovernmentApiConfigured = () =>
  Boolean(process.env.GOVERNMENT_API_URL && process.env.GOVERNMENT_API_KEY);

const concernLabels = (concerns = []) =>
  concerns
    .map((value) => CONCERN_OPTIONS.find((opt) => opt.value === value)?.label || value)
    .filter(Boolean);

const buildOfficialPayload = (report) => {
  const reportedAt = report.reportedAt || report.createdAt || new Date();
  return {
    fullName: report.fullName || report.reporterId?.name || '',
    phone: report.phone || '',
    email: report.email || '',
    state: report.state || '',
    district: report.district || '',
    taluka: report.taluka || '',
    village: report.village || '',
    address: report.address || report.locationDescription || '',
    latitude: report.coordinates?.latitude ?? null,
    longitude: report.coordinates?.longitude ?? null,
    waterSource: report.waterSourceName || report.sourceId?.name || '',
    waterSourceType: report.waterSourceType || report.sourceId?.type || '',
    concernType: concernLabels(report.concerns),
    description: report.description,
    date: new Date(reportedAt).toISOString().slice(0, 10),
    time: new Date(reportedAt).toISOString().slice(11, 19),
    supportingImages: report.imageUrls?.length ? report.imageUrls : report.photoUrl ? [report.photoUrl] : [],
    safedropReportReference: report.referenceId || String(report._id),
    assignedDepartment: report.assignedDepartment || '',
    routingCategory: report.routingCategory || '',
  };
};

const submitReportToGovernment = async (report) => {
  const payload = buildOfficialPayload(report);

  if (!isGovernmentApiConfigured()) {
    report.officialPayload = payload;
    report.officialSubmissionStatus = 'READY_FOR_OFFICIAL_SUBMISSION';
    report.officialLastError = '';
    await report.save();
    return {
      submitted: false,
      configured: false,
      status: report.officialSubmissionStatus,
      payload,
      message:
        'Official submission is prepared but no government API is currently connected.',
    };
  }

  try {
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.GOVERNMENT_API_KEY}`,
    };
    if (process.env.GOVERNMENT_API_SECRET) {
      headers['X-Api-Secret'] = process.env.GOVERNMENT_API_SECRET;
    }

    const res = await fetch(process.env.GOVERNMENT_API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      report.officialPayload = payload;
      report.officialSubmissionStatus = 'FAILED';
      report.officialLastError = 'The government service did not accept this report.';
      await report.save();
      return {
        submitted: false,
        configured: true,
        status: 'FAILED',
        payload,
        message: 'The government service could not accept this report. SafeDrop has kept a copy.',
      };
    }

    const officialId = body.referenceId || body.officialReferenceId || body.id || '';
    report.officialPayload = payload;
    report.officialReferenceId = String(officialId);
    report.officialSubmissionStatus = officialId ? 'CONFIRMED' : 'SUBMITTED';
    report.officialSubmittedAt = new Date();
    report.officialLastError = '';
    await report.save();

    return {
      submitted: true,
      configured: true,
      status: report.officialSubmissionStatus,
      officialReferenceId: report.officialReferenceId,
      payload,
      message: officialId
        ? 'The report was accepted by the configured government service.'
        : 'The report was sent to the configured government service.',
    };
  } catch (err) {
    report.officialPayload = payload;
    report.officialSubmissionStatus = 'FAILED';
    report.officialLastError = 'The government service is currently unavailable.';
    await report.save();
    return {
      submitted: false,
      configured: true,
      status: 'FAILED',
      payload,
      message: 'The government service is currently unavailable. SafeDrop has kept a copy of this report.',
    };
  }
};

const getGovernmentReportStatus = async (referenceId) => {
  const mongoose = require('mongoose');
  const query = [{ referenceId }, { officialReferenceId: referenceId }];
  if (mongoose.Types.ObjectId.isValid(referenceId) && String(referenceId).length === 24) {
    query.push({ _id: referenceId });
  }
  const report = await CommunityReport.findOne({ $or: query });
  if (!report) {
    return null;
  }

  if (!isGovernmentApiConfigured() || !report.officialReferenceId) {
    return {
      officialSubmissionStatus: report.officialSubmissionStatus,
      officialReferenceId: report.officialReferenceId || '',
      configured: isGovernmentApiConfigured(),
    };
  }

  try {
    const statusUrl =
      process.env.GOVERNMENT_STATUS_URL ||
      `${String(process.env.GOVERNMENT_API_URL).replace(/\/$/, '')}/status/${encodeURIComponent(
        report.officialReferenceId
      )}`;
    const res = await fetch(statusUrl, {
      headers: {
        Authorization: `Bearer ${process.env.GOVERNMENT_API_KEY}`,
        Accept: 'application/json',
      },
    });
    if (!res.ok) {
      return {
        officialSubmissionStatus: report.officialSubmissionStatus,
        officialReferenceId: report.officialReferenceId,
        configured: true,
      };
    }
    const body = await res.json();
    if (body.status) {
      report.officialSubmissionStatus = body.status === 'CONFIRMED' ? 'CONFIRMED' : report.officialSubmissionStatus;
      await report.save();
    }
    return {
      officialSubmissionStatus: report.officialSubmissionStatus,
      officialReferenceId: report.officialReferenceId,
      configured: true,
      remote: body,
    };
  } catch (err) {
    return {
      officialSubmissionStatus: report.officialSubmissionStatus,
      officialReferenceId: report.officialReferenceId,
      configured: true,
    };
  }
};

module.exports = {
  isGovernmentApiConfigured,
  buildOfficialPayload,
  submitReportToGovernment,
  getGovernmentReportStatus,
};
