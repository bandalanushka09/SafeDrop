const WaterSource = require('../models/WaterSource');
const WaterTest = require('../models/WaterTest');
const CommunityReport = require('../models/CommunityReport');
const SafetyAlert = require('../models/SafetyAlert');
const RiskFlag = require('../models/RiskFlag');
const { logAudit } = require('../services/auditService');
const { SOURCE_TYPES } = require('../utils/reportConstants');

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildCoordinates = (latitude, longitude) => {
  const coordinates = {};
  if (latitude !== undefined && latitude !== '' && !Number.isNaN(Number(latitude))) {
    coordinates.latitude = Number(latitude);
  }
  if (longitude !== undefined && longitude !== '' && !Number.isNaN(Number(longitude))) {
    coordinates.longitude = Number(longitude);
  }
  return coordinates;
};

const applySourceFields = (source, body) => {
  const fields = [
    'name',
    'type',
    'village',
    'taluka',
    'district',
    'state',
    'address',
    'description',
    'status',
    'photoUrl',
    'capacity',
    'riskLevel',
    'lastTestResult',
  ];
  fields.forEach((field) => {
    if (body[field] !== undefined) {
      source[field] = typeof body[field] === 'string' ? body[field].trim() : body[field];
    }
  });
  if (body.servingPopulation !== undefined) {
    source.servingPopulation = Number(body.servingPopulation) || 0;
  }
  if (body.latitude !== undefined || body.longitude !== undefined) {
    const coords = buildCoordinates(body.latitude, body.longitude);
    if (coords.latitude !== undefined && coords.longitude !== undefined) {
      source.coordinates = coords;
    }
  }
};

const getWaterSources = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      village,
      type,
      status,
      search,
      state,
      district,
      taluka,
      riskLevel,
      testingStatus,
      includeArchived = 'false',
      forMap,
      minLat,
      maxLat,
      minLng,
      maxLng,
    } = req.query;

    const query = {};
    if (includeArchived !== 'true') {
      query.isArchived = false;
    }
    if (village) query.village = new RegExp(escapeRegex(village), 'i');
    if (type) query.type = type;
    if (status) query.status = status;
    if (state) query.state = new RegExp(`^${escapeRegex(state)}$`, 'i');
    if (district) query.district = new RegExp(escapeRegex(district), 'i');
    if (taluka) query.taluka = new RegExp(escapeRegex(taluka), 'i');
    if (riskLevel) query.riskLevel = riskLevel;

    if (testingStatus === 'tested') {
      query.lastTestedAt = { $exists: true, $ne: null };
    } else if (testingStatus === 'not_tested') {
      query.$or = [{ lastTestedAt: { $exists: false } }, { lastTestedAt: null }, { lastTestDate: null }];
    }

    if (minLat && maxLat && minLng && maxLng) {
      query['coordinates.latitude'] = { $gte: Number(minLat), $lte: Number(maxLat) };
      query['coordinates.longitude'] = { $gte: Number(minLng), $lte: Number(maxLng) };
    }

    if (search) {
      const escapedSearch = escapeRegex(search);
      const searchClause = {
        $or: [
          { name: { $regex: escapedSearch, $options: 'i' } },
          { address: { $regex: escapedSearch, $options: 'i' } },
          { village: { $regex: escapedSearch, $options: 'i' } },
          { district: { $regex: escapedSearch, $options: 'i' } },
          { taluka: { $regex: escapedSearch, $options: 'i' } },
          { state: { $regex: escapedSearch, $options: 'i' } },
          { description: { $regex: escapedSearch, $options: 'i' } },
        ],
      };
      query.$and = query.$and || [];
      query.$and.push(searchClause);
    }

    const parsedLimit = forMap === 'true' ? Math.min(Number(limit) || 1500, 2000) : Number(limit);
    const skip = (Number(page) - 1) * parsedLimit;

    const projection =
      forMap === 'true'
        ? 'name type village taluka district state address status riskLevel capacity lastTestDate lastTestResult lastTestedAt coordinates servingPopulation updatedAt'
        : undefined;

    const sourcesQuery = WaterSource.find(query, projection).sort({ updatedAt: -1 });
    if (forMap !== 'true') {
      sourcesQuery.populate('createdBy', 'name email role');
    }

    const [sources, total] = await Promise.all([
      sourcesQuery.skip(skip).limit(parsedLimit),
      WaterSource.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: sources,
      meta: {
        total,
        page: Number(page),
        limit: parsedLimit,
        totalPages: Math.ceil(total / parsedLimit) || 1,
        sourceTypes: SOURCE_TYPES,
      },
    });
  } catch (err) {
    next(err);
  }
};

const getWaterSourceById = async (req, res, next) => {
  try {
    const source = await WaterSource.findById(req.params.id).populate('createdBy', 'name email role');
    if (!source) {
      return res.status(404).json({ success: false, message: 'Water source not found' });
    }

    const recentTests = await WaterTest.find({ sourceId: source._id }).sort({ testedAt: -1 }).limit(20);

    const activeAlerts = await SafetyAlert.find({
      status: 'published',
      $or: [{ affectedSourceIds: source._id }, { affectedVillage: source.village }],
    }).sort({ publishedAt: -1 });

    const activeFlags = await RiskFlag.find({
      sourceId: source._id,
      reviewStatus: { $in: ['pending_review', 'investigating', 'acknowledged'] },
    }).sort({ createdAt: -1 });

    const relatedReports = await CommunityReport.find({
      $or: [{ sourceId: source._id }, { waterSourceId: source._id }],
    })
      .select('referenceId status concerns category village reportedAt createdAt officialSubmissionStatus')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      success: true,
      data: {
        ...source.toObject(),
        recentTests,
        activeAlerts,
        activeFlags,
        relatedReports,
        totalReportsCount: relatedReports.length,
      },
    });
  } catch (err) {
    next(err);
  }
};

const createWaterSource = async (req, res, next) => {
  try {
    const { name, type, village } = req.body;

    if (!name || !type || !village) {
      return res.status(400).json({
        success: false,
        message: 'Name, source type, and village are mandatory fields.',
      });
    }

    const source = new WaterSource({
      createdBy: req.user._id,
      riskLevel: req.body.riskLevel || 'UNKNOWN',
    });
    applySourceFields(source, req.body);
    await source.save();

    await logAudit({
      actor: req.user,
      action: 'WATER_SOURCE_CREATED',
      entityType: 'WaterSource',
      entityId: source._id,
      safeMetadata: { name: source.name, village: source.village, type: source.type },
    });

    res.status(201).json({
      success: true,
      message: 'Water source registered successfully.',
      data: source,
    });
  } catch (err) {
    next(err);
  }
};

const updateWaterSource = async (req, res, next) => {
  try {
    const source = await WaterSource.findById(req.params.id);
    if (!source) {
      return res.status(404).json({ success: false, message: 'Water source not found' });
    }

    applySourceFields(source, req.body);
    await source.save();

    await logAudit({
      actor: req.user,
      action: 'WATER_SOURCE_UPDATED',
      entityType: 'WaterSource',
      entityId: source._id,
      safeMetadata: { updates: Object.keys(req.body) },
    });

    res.json({
      success: true,
      message: 'Water source updated successfully.',
      data: source,
    });
  } catch (err) {
    next(err);
  }
};

const deleteWaterSource = async (req, res, next) => {
  try {
    const source = await WaterSource.findById(req.params.id);
    if (!source) {
      return res.status(404).json({ success: false, message: 'Water source not found' });
    }

    source.isArchived = true;
    source.status = 'deactivated';
    await source.save();

    await logAudit({
      actor: req.user,
      action: 'WATER_SOURCE_ARCHIVED',
      entityType: 'WaterSource',
      entityId: source._id,
      safeMetadata: { name: source.name },
    });

    res.json({
      success: true,
      message: 'Water source archived successfully.',
      data: source,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getWaterSources,
  getWaterSourceById,
  createWaterSource,
  updateWaterSource,
  deleteWaterSource,
};
