const REPORT_STATUSES = ['NEW', 'UNDER_REVIEW', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'];

const LEGACY_STATUS_MAP = {
  submitted: 'NEW',
  under_review: 'UNDER_REVIEW',
  action_required: 'IN_PROGRESS',
  resolved: 'RESOLVED',
  rejected: 'REJECTED',
};

const OPEN_STATUSES = ['NEW', 'UNDER_REVIEW', 'ASSIGNED', 'IN_PROGRESS', 'submitted', 'under_review', 'action_required'];

const OFFICIAL_STATUSES = [
  'NOT_PREPARED',
  'READY_FOR_OFFICIAL_SUBMISSION',
  'PREPARED',
  'SUBMITTED',
  'CONFIRMED',
  'FAILED',
  'NOT_CONFIGURED',
];

const CONCERN_OPTIONS = [
  { value: 'dirty_or_muddy_water', label: 'Dirty or muddy water' },
  { value: 'bad_smell', label: 'Bad smell' },
  { value: 'unusual_taste', label: 'Unusual taste' },
  { value: 'water_discoloration', label: 'Water discoloration' },
  { value: 'suspected_contamination', label: 'Suspected contamination' },
  { value: 'water_tank_dirty', label: 'Water tank is dirty' },
  { value: 'water_tank_damaged', label: 'Water tank damaged' },
  { value: 'sewage_near_water_source', label: 'Sewage near water source' },
  { value: 'dead_animal_near_water_source', label: 'Dead animal near water source' },
  { value: 'water_source_not_functioning', label: 'Water source not functioning' },
  { value: 'possible_disease_outbreak', label: 'Possible disease outbreak' },
  { value: 'unsafe_drinking_water', label: 'Unsafe drinking water' },
  { value: 'other', label: 'Other' },
];

const CONCERN_TO_CATEGORY = {
  dirty_or_muddy_water: 'unusual_color',
  water_discoloration: 'unusual_color',
  bad_smell: 'unusual_odor',
  unusual_taste: 'unusual_odor',
  water_tank_dirty: 'visible_debris',
  suspected_contamination: 'suspected_contamination',
  unsafe_drinking_water: 'suspected_contamination',
  water_tank_damaged: 'damaged_infrastructure',
  water_source_not_functioning: 'supply_interruption',
  sewage_near_water_source: 'sewage_leakage',
  dead_animal_near_water_source: 'sewage_leakage',
  possible_disease_outbreak: 'illness_cluster',
  other: 'other',
};

const CONCERN_TO_DEPARTMENT_CATEGORY = {
  dirty_or_muddy_water: 'water_supply',
  water_discoloration: 'water_supply',
  bad_smell: 'public_health',
  unusual_taste: 'public_health',
  water_tank_dirty: 'water_supply',
  suspected_contamination: 'public_health',
  unsafe_drinking_water: 'public_health',
  water_tank_damaged: 'municipal',
  water_source_not_functioning: 'water_supply',
  sewage_near_water_source: 'sanitation',
  dead_animal_near_water_source: 'sanitation',
  possible_disease_outbreak: 'public_health',
  other: 'water_supply',
};

const SOURCE_TYPES = [
  'hand_pump',
  'borewell',
  'open_well',
  'public_tap',
  'water_tank',
  'reservoir',
  'community_supply',
  'community_water_source',
  'other',
  'unknown',
];

const normalizeStatus = (status) => {
  if (!status) return 'NEW';
  if (LEGACY_STATUS_MAP[status]) return LEGACY_STATUS_MAP[status];
  if (REPORT_STATUSES.includes(status)) return status;
  return status;
};

const statusQuery = (status) => {
  if (!status) return null;
  const canonical = normalizeStatus(status);
  const aliases = Object.entries(LEGACY_STATUS_MAP)
    .filter(([, value]) => value === canonical)
    .map(([key]) => key);
  return { $in: [canonical, status, ...aliases] };
};

const INDIAN_PHONE_REGEX = /^(\+91[\s-]?)?[6-9]\d{9}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const sanitizeText = (value, max = 2000) => {
  if (value === undefined || value === null) return '';
  return String(value)
    .replace(/<[^>]*>/g, '')
    .replace(/[\u0000-\u001F]+/g, ' ')
    .trim()
    .slice(0, max);
};

module.exports = {
  REPORT_STATUSES,
  LEGACY_STATUS_MAP,
  OPEN_STATUSES,
  OFFICIAL_STATUSES,
  CONCERN_OPTIONS,
  CONCERN_TO_CATEGORY,
  CONCERN_TO_DEPARTMENT_CATEGORY,
  SOURCE_TYPES,
  normalizeStatus,
  statusQuery,
  INDIAN_PHONE_REGEX,
  EMAIL_REGEX,
  sanitizeText,
};
