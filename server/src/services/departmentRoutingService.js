const GovernmentDepartment = require('../models/GovernmentDepartment');
const { CONCERN_TO_DEPARTMENT_CATEGORY } = require('../utils/reportConstants');

const inferRoutingCategory = (concerns = []) => {
  if (!concerns.length) return 'water_supply';
  if (concerns.includes('possible_disease_outbreak')) return 'public_health';
  if (concerns.includes('sewage_near_water_source') || concerns.includes('dead_animal_near_water_source')) {
    return 'sanitation';
  }
  if (concerns.includes('water_tank_damaged')) return 'municipal';
  const first = concerns[0];
  return CONCERN_TO_DEPARTMENT_CATEGORY[first] || 'water_supply';
};

const routeReport = async ({ state = '', district = '', concerns = [] }) => {
  const category = inferRoutingCategory(concerns);
  const enabled = { enabled: true, category };

  let department =
    (district &&
      state &&
      (await GovernmentDepartment.findOne({
        ...enabled,
        state: new RegExp(`^${state}$`, 'i'),
        district: new RegExp(`^${district}$`, 'i'),
      }))) ||
    (state &&
      (await GovernmentDepartment.findOne({
        ...enabled,
        state: new RegExp(`^${state}$`, 'i'),
        $or: [{ district: '' }, { district: null }],
      }))) ||
    (await GovernmentDepartment.findOne({ ...enabled, state: '' })) ||
    (await GovernmentDepartment.findOne({ enabled: true, category }));

  return {
    routingCategory: category,
    assignedDepartment: department?.departmentName || '',
    assignedDepartmentId: department?._id || null,
    department,
  };
};

module.exports = { routeReport, inferRoutingCategory };
