const WaterTest = require('../models/WaterTest');
const WaterSource = require('../models/WaterSource');
const RiskFlag = require('../models/RiskFlag');
const { evaluateWaterTest } = require('../services/riskEngine');
const { logAudit } = require('../services/auditService');

const getWaterTests = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      sourceId,
      village,
      status,
      parameter,
      startDate,
      endDate,
    } = req.query;

    const query = {};

    if (sourceId) query.sourceId = sourceId;
    if (status) query.verificationStatus = status;
    if (parameter) {
      query['parameters.parameter'] = parameter.toLowerCase();
    }

    if (startDate || endDate) {
      query.testedAt = {};
      if (startDate) query.testedAt.$gte = new Date(startDate);
      if (endDate) query.testedAt.$lte = new Date(endDate);
    }

    if (village) {
      const sourcesInVillage = await WaterSource.find({ village }).select('_id');
      query.sourceId = { $in: sourcesInVillage.map((s) => s._id) };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [tests, total] = await Promise.all([
      WaterTest.find(query)
        .populate('sourceId', 'name type village address')
        .populate('testerId', 'name email role')
        .sort({ testedAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      WaterTest.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: tests,
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

const getWaterTestById = async (req, res, next) => {
  try {
    const test = await WaterTest.findById(req.params.id)
      .populate('sourceId', 'name type village address coordinates status')
      .populate('testerId', 'name email role')
      .populate('reviewedBy', 'name email role');

    if (!test) {
      return res.status(404).json({ success: false, message: 'Water test record not found' });
    }

    const flags = await RiskFlag.find({ testId: test._id }).populate('ruleId');

    res.json({
      success: true,
      data: {
        ...test.toObject(),
        flags,
      },
    });
  } catch (err) {
    next(err);
  }
};

const createWaterTest = async (req, res, next) => {
  try {
    const {
      sourceId,
      testedAt,
      parameters,
      testingMethod,
      laboratory,
      notes,
      attachmentUrl,
      verificationStatus,
    } = req.body;

    if (!sourceId) {
      return res.status(400).json({ success: false, message: 'Water source ID is required' });
    }

    if (!parameters || !Array.isArray(parameters) || parameters.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one water-quality parameter reading is required.',
      });
    }

    const source = await WaterSource.findById(sourceId);
    if (!source) {
      return res.status(404).json({ success: false, message: 'Referenced water source not found' });
    }

    // Role-based verification status defaults:
    // Health worker can set pending or reviewed; admin can set verified directly
    let initialStatus = 'pending';
    if (req.user.role === 'admin' && verificationStatus) {
      initialStatus = verificationStatus;
    } else if (req.user.role === 'health_worker' && verificationStatus === 'reviewed') {
      initialStatus = 'reviewed';
    }

    const test = new WaterTest({
      sourceId,
      testedAt: testedAt ? new Date(testedAt) : new Date(),
      parameters,
      testingMethod: testingMethod || 'field_kit',
      laboratory: laboratory ? laboratory.trim() : '',
      testerId: req.user._id,
      testerName: req.user.name,
      verificationStatus: initialStatus,
      notes: notes ? notes.trim() : '',
      attachmentUrl: attachmentUrl || '',
    });

    await test.save();

    source.lastTestedAt = test.testedAt;
    source.lastTestDate = test.testedAt;
    const ecoli = (parameters || []).find((p) => String(p.parameter).toLowerCase() === 'ecoli');
    const turbidity = (parameters || []).find((p) => String(p.parameter).toLowerCase() === 'turbidity');
    if (ecoli && Number(ecoli.value) > 0) {
      source.riskLevel = 'HIGH_RISK';
      source.lastTestResult = 'Microbial indicator detected';
    } else if (turbidity && Number(turbidity.value) > 5) {
      source.riskLevel = 'WARNING';
      source.lastTestResult = 'Elevated turbidity';
    } else {
      source.riskLevel = 'SAFE';
      source.lastTestResult = 'No critical threshold breaches recorded at time of test';
    }
    await source.save();

    const flags = await evaluateWaterTest(test, source);
    if (flags.some((f) => ['critical_review', 'high_priority'].includes(f.severity))) {
      source.riskLevel = 'HIGH_RISK';
      source.lastTestResult = flags.map((f) => f.parameterName || f.parameter).join(', ');
      await source.save();
    } else if (flags.some((f) => f.severity === 'warning')) {
      source.riskLevel = 'WARNING';
      source.lastTestResult = flags.map((f) => f.parameterName || f.parameter).join(', ');
      await source.save();
    }

    await logAudit({
      actor: req.user,
      action: 'WATER_TEST_RECORDED',
      entityType: 'WaterTest',
      entityId: test._id,
      safeMetadata: {
        sourceId: source._id,
        sourceName: source.name,
        flagsGenerated: flags.length,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Water-quality test recorded successfully.',
      data: test,
      evaluation: {
        flagsGenerated: flags.length,
        flags,
      },
    });
  } catch (err) {
    next(err);
  }
};

const updateWaterTest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { verificationStatus, reviewNotes, notes } = req.body;

    const test = await WaterTest.findById(id);
    if (!test) {
      return res.status(404).json({ success: false, message: 'Water test record not found' });
    }

    if (verificationStatus) {
      // Villagers cannot modify status
      if (req.user.role === 'villager') {
        return res.status(403).json({ success: false, message: 'Unauthorized action' });
      }

      // Only admin can mark verified
      if (verificationStatus === 'verified' && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Only system administrators can mark a water-quality test as verified.',
        });
      }

      test.verificationStatus = verificationStatus;
      test.reviewedBy = req.user._id;
      test.reviewedAt = new Date();
    }

    if (reviewNotes !== undefined) test.reviewNotes = reviewNotes.trim();
    if (notes !== undefined) test.notes = notes.trim();

    await test.save();

    await logAudit({
      actor: req.user,
      action: 'WATER_TEST_STATUS_UPDATED',
      entityType: 'WaterTest',
      entityId: test._id,
      safeMetadata: { verificationStatus: test.verificationStatus },
    });

    res.json({
      success: true,
      message: 'Water test updated successfully.',
      data: test,
    });
  } catch (err) {
    next(err);
  }
};

const getTestsBySource = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tests = await WaterTest.find({ sourceId: id })
      .populate('testerId', 'name email role')
      .sort({ testedAt: -1 });

    res.json({
      success: true,
      data: tests,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getWaterTests,
  getWaterTestById,
  createWaterTest,
  updateWaterTest,
  getTestsBySource,
};

