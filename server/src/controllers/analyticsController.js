const WaterSource = require('../models/WaterSource');
const WaterTest = require('../models/WaterTest');
const CommunityReport = require('../models/CommunityReport');
const SafetyAlert = require('../models/SafetyAlert');
const RiskFlag = require('../models/RiskFlag');
const User = require('../models/User');

const getSummary = async (req, res, next) => {
  try {
    const [
      totalSources,
      activeSources,
      underInspectionSources,
      safeSources,
      warningSources,
      highRiskSources,
      unknownRiskSources,
      totalTests,
      pendingTests,
      verifiedTests,
      totalReports,
      openReports,
      resolvedReports,
      activeAlerts,
      totalUsers,
      pendingFlags,
      userRoles,
    ] = await Promise.all([
      WaterSource.countDocuments({ isArchived: false }),
      WaterSource.countDocuments({ isArchived: false, status: 'active' }),
      WaterSource.countDocuments({ isArchived: false, status: 'under_inspection' }),
      WaterSource.countDocuments({ isArchived: false, riskLevel: 'SAFE' }),
      WaterSource.countDocuments({ isArchived: false, riskLevel: 'WARNING' }),
      WaterSource.countDocuments({ isArchived: false, riskLevel: 'HIGH_RISK' }),
      WaterSource.countDocuments({ isArchived: false, riskLevel: { $in: ['UNKNOWN', null] } }),
      WaterTest.countDocuments(),
      WaterTest.countDocuments({ verificationStatus: 'pending' }),
      WaterTest.countDocuments({ verificationStatus: 'verified' }),
      CommunityReport.countDocuments(),
      CommunityReport.countDocuments({
        status: { $in: ['submitted', 'under_review', 'action_required', 'NEW', 'UNDER_REVIEW', 'ASSIGNED', 'IN_PROGRESS'] },
      }),
      CommunityReport.countDocuments({ status: { $in: ['resolved', 'RESOLVED'] } }),
      SafetyAlert.countDocuments({
        status: 'published',
        $or: [{ expiresAt: { $exists: false } }, { expiresAt: null }, { expiresAt: { $gt: new Date() } }],
      }),
      User.countDocuments(),
      RiskFlag.countDocuments({ reviewStatus: 'pending_review' }),
      User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
    ]);

    const roleBreakdown = { villager: 0, health_worker: 0, admin: 0 };
    userRoles.forEach((item) => {
      if (roleBreakdown[item._id] !== undefined) {
        roleBreakdown[item._id] = item.count;
      }
    });

    res.json({
      success: true,
      data: {
        sources: {
          total: totalSources,
          active: activeSources,
          underInspection: underInspectionSources,
          safe: safeSources,
          warning: warningSources,
          highRisk: highRiskSources,
          notTested: unknownRiskSources,
        },
        tests: {
          total: totalTests,
          pending: pendingTests,
          verified: verifiedTests,
        },
        reports: {
          total: totalReports,
          open: openReports,
          resolved: resolvedReports,
        },
        alerts: {
          active: activeAlerts,
        },
        riskFlags: {
          pending: pendingFlags,
        },
        users: {
          total: totalUsers,
          byRole: roleBreakdown,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

const getWaterTestAnalytics = async (req, res, next) => {
  try {
    const { village, parameter = 'ph' } = req.query;

    let matchQuery = {};
    if (village) {
      const sources = await WaterSource.find({ village }).select('_id');
      matchQuery.sourceId = { $in: sources.map((s) => s._id) };
    }

    // Aggregate monthly test records over last 12 months
    const testsOverTime = await WaterTest.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            year: { $year: '$testedAt' },
            month: { $month: '$testedAt' },
          },
          count: { $sum: 1 },
          verifiedCount: {
            $sum: { $cond: [{ $eq: ['$verificationStatus', 'verified'] }, 1, 0] },
          },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 },
    ]);

    // Parameter value distribution
    const paramTrends = await WaterTest.aggregate([
      { $match: matchQuery },
      { $unwind: '$parameters' },
      {
        $match: {
          'parameters.parameter': parameter.toLowerCase(),
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$testedAt' },
            month: { $month: '$testedAt' },
          },
          avgValue: { $avg: '$parameters.value' },
          minValue: { $min: '$parameters.value' },
          maxValue: { $max: '$parameters.value' },
          unit: { $first: '$parameters.unit' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 },
    ]);

    // Format for Recharts
    const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const formattedTests = testsOverTime.map((item) => ({
      period: `${monthNames[item._id.month]} ${item._id.year}`,
      totalTests: item.count,
      verifiedTests: item.verifiedCount,
    }));

    const formattedParams = paramTrends.map((item) => ({
      period: `${monthNames[item._id.month]} ${item._id.year}`,
      average: Number((item.avgValue || 0).toFixed(2)),
      min: Number((item.minValue || 0).toFixed(2)),
      max: Number((item.maxValue || 0).toFixed(2)),
      unit: item.unit,
      count: item.count,
    }));

    res.json({
      success: true,
      data: {
        testsOverTime: formattedTests,
        parameterTrends: formattedParams,
      },
    });
  } catch (err) {
    next(err);
  }
};

const getReportAnalytics = async (req, res, next) => {
  try {
    const [byStatus, byCategory] = await Promise.all([
      CommunityReport.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
      CommunityReport.aggregate([
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const formattedStatus = byStatus.map((s) => ({
      status: s._id,
      label: s._id.replace('_', ' ').toUpperCase(),
      count: s.count,
    }));

    const formattedCategory = byCategory.map((c) => ({
      category: c._id,
      label: c._id.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      count: c.count,
    }));

    res.json({
      success: true,
      data: {
        byStatus: formattedStatus,
        byCategory: formattedCategory,
      },
    });
  } catch (err) {
    next(err);
  }
};

const getAlertAnalytics = async (req, res, next) => {
  try {
    const [bySeverity, byStatus] = await Promise.all([
      SafetyAlert.aggregate([
        {
          $group: {
            _id: '$severity',
            count: { $sum: 1 },
          },
        },
      ]),
      SafetyAlert.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        bySeverity: bySeverity.map((s) => ({ severity: s._id, count: s.count })),
        byStatus: byStatus.map((s) => ({ status: s._id, count: s.count })),
      },
    });
  } catch (err) {
    next(err);
  }
};

const getVillageAnalytics = async (req, res, next) => {
  try {
    const [sourcesPerVillage, reportsPerVillage] = await Promise.all([
      WaterSource.aggregate([
        { $match: { isArchived: false } },
        {
          $group: {
            _id: '$village',
            sourcesCount: { $sum: 1 },
            activeCount: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
          },
        },
        { $sort: { sourcesCount: -1 } },
      ]),
      CommunityReport.aggregate([
        {
          $group: {
            _id: '$village',
            reportsCount: { $sum: 1 },
            openReports: {
              $sum: {
                $cond: [
                  {
                    $in: [
                      '$status',
                      ['submitted', 'under_review', 'action_required', 'NEW', 'UNDER_REVIEW', 'ASSIGNED', 'IN_PROGRESS'],
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
        { $sort: { reportsCount: -1 } },
      ]),
    ]);

    // Merge by village name
    const villageMap = {};
    sourcesPerVillage.forEach((s) => {
      villageMap[s._id] = {
        village: s._id,
        sourcesCount: s.sourcesCount,
        activeSources: s.activeCount,
        reportsCount: 0,
        openReports: 0,
      };
    });

    reportsPerVillage.forEach((r) => {
      if (!villageMap[r._id]) {
        villageMap[r._id] = {
          village: r._id,
          sourcesCount: 0,
          activeSources: 0,
          reportsCount: r.reportsCount,
          openReports: r.openReports,
        };
      } else {
        villageMap[r._id].reportsCount = r.reportsCount;
        villageMap[r._id].openReports = r.openReports;
      }
    });

    res.json({
      success: true,
      data: Object.values(villageMap),
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getSummary,
  getWaterTestAnalytics,
  getReportAnalytics,
  getAlertAnalytics,
  getVillageAnalytics,
};

