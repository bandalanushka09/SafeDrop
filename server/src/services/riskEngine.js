const RiskRule = require('../models/RiskRule');
const RiskFlag = require('../models/RiskFlag');
const { notifyRoleUsers } = require('./notificationService');

const evaluateCondition = (val, operator, threshold) => {
  const numVal = Number(val);
  const numThreshold = Number(threshold);
  switch (operator) {
    case '<':
      return numVal < numThreshold;
    case '<=':
      return numVal <= numThreshold;
    case '>':
      return numVal > numThreshold;
    case '>=':
      return numVal >= numThreshold;
    case '==':
      return numVal === numThreshold;
    case '!=':
      return numVal !== numThreshold;
    default:
      return false;
  }
};

const evaluateWaterTest = async (waterTest, waterSource) => {
  try {
    const activeRules = await RiskRule.find({ active: true });
    if (!activeRules.length || !waterTest.parameters || !waterTest.parameters.length) {
      return [];
    }

    const generatedFlags = [];

    for (const rule of activeRules) {
      // Find parameter matching rule
      const testParam = waterTest.parameters.find(
        (p) => p.parameter.toLowerCase() === rule.parameter.toLowerCase()
      );

      if (!testParam) continue;

      const isTriggered = evaluateCondition(
        testParam.value,
        rule.comparisonOperator,
        rule.threshold
      );

      if (isTriggered) {
        const explanation =
          rule.explanationTemplate ||
          `Measured ${rule.parameterName} is ${testParam.value} ${testParam.unit}, which violates acceptable guideline threshold (${rule.comparisonOperator} ${rule.threshold} ${rule.unit}). Reference: ${rule.reference}`;

        const flag = new RiskFlag({
          sourceId: waterTest.sourceId,
          testId: waterTest._id,
          ruleId: rule._id,
          parameter: rule.parameter,
          parameterName: rule.parameterName,
          measuredValue: testParam.value,
          unit: testParam.unit,
          threshold: rule.threshold,
          operator: rule.comparisonOperator,
          severity: rule.severity,
          explanation,
          recommendation: rule.recommendation,
          reviewStatus: 'pending_review',
        });

        await flag.save();
        generatedFlags.push(flag);

        // Notify health workers and admins if high priority or critical
        if (rule.severity === 'high_priority' || rule.severity === 'critical_review') {
          const sourceName = waterSource ? waterSource.name : 'Unknown source';
          const villageName = waterSource ? waterSource.village : 'General';
          await notifyRoleUsers({
            roles: ['health_worker', 'admin'],
            village: villageName,
            title: `Water Risk Flag: ${rule.parameterName} (${rule.severity.replace('_', ' ')})`,
            message: `Source "${sourceName}" in ${villageName} recorded ${rule.parameterName} = ${testParam.value} ${testParam.unit}. ${rule.recommendation}`,
            type: 'risk_flag',
            relatedEntityType: 'flag',
            relatedEntityId: flag._id,
          });
        }
      }
    }

    return generatedFlags;
  } catch (err) {
    console.error('[RiskEngine] Error evaluating water test:', err.message);
    return [];
  }
};

module.exports = {
  evaluateWaterTest,
  evaluateCondition,
};

