const bcrypt = require('bcryptjs');
const User = require('../src/models/User');
const WaterSource = require('../src/models/WaterSource');
const WaterTest = require('../src/models/WaterTest');
const CommunityReport = require('../src/models/CommunityReport');
const RiskRule = require('../src/models/RiskRule');
const RiskFlag = require('../src/models/RiskFlag');
const SafetyAlert = require('../src/models/SafetyAlert');
const DiseaseArticle = require('../src/models/DiseaseArticle');
const Village = require('../src/models/Village');
const Notification = require('../src/models/Notification');
const { evaluateWaterTest } = require('../src/services/riskEngine');
const GovernmentDepartment = require('../src/models/GovernmentDepartment');
const ReportSequence = require('../src/models/ReportSequence');

const runSeed = async () => {
  // Villages
  const villagesData = [
    { name: 'Rampur', district: 'East Block', population: 2450, primaryContact: '+91 98765 43210' },
    { name: 'Sunderpur', district: 'North Block', population: 1890, primaryContact: '+91 98765 43211' },
    { name: 'Devgarh', district: 'West Block', population: 3120, primaryContact: '+91 98765 43212' },
    { name: 'Bheemtal', district: 'South Block', population: 1400, primaryContact: '+91 98765 43213' },
    { name: 'Central District', district: 'Central Zone', population: 5200, primaryContact: '+91 98765 43214' },
  ];
  await Village.insertMany(villagesData);

  // Users
  const salt = await bcrypt.genSalt(10);
  const adminPass = await bcrypt.hash('AdminSecurePass123!', salt);
  const workerPass = await bcrypt.hash('WorkerSecurePass123!', salt);
  const villagerPass = await bcrypt.hash('VillagerSecurePass123!', salt);

  const admin = await User.create({
    name: 'Dr. Aruna Mehta',
    email: 'admin@safedrop.org',
    passwordHash: adminPass,
    role: 'admin',
    village: 'Central District',
    phoneNumber: '+91 98111 22233',
    preferredLanguage: 'en',
    accountStatus: 'active',
  });

  const healthWorker = await User.create({
    name: 'Ramesh Patil',
    email: 'worker@safedrop.org',
    passwordHash: workerPass,
    role: 'health_worker',
    village: 'Rampur',
    phoneNumber: '+91 98222 33344',
    preferredLanguage: 'en',
    accountStatus: 'active',
  });

  const villager = await User.create({
    name: 'Sunita Sharma',
    email: 'villager@safedrop.org',
    passwordHash: villagerPass,
    role: 'villager',
    village: 'Rampur',
    phoneNumber: '+91 98333 44455',
    preferredLanguage: 'en',
    accountStatus: 'active',
  });

  const villager2 = await User.create({
    name: 'Mohan Lal',
    email: 'mohan@safedrop.org',
    passwordHash: villagerPass,
    role: 'villager',
    village: 'Sunderpur',
    phoneNumber: '+91 98444 55566',
    preferredLanguage: 'en',
    accountStatus: 'active',
  });

  // Rules
  const rulesData = [
    {
      parameter: 'ph',
      parameterName: 'Low pH (Acidic)',
      comparisonOperator: '<',
      threshold: 6.5,
      unit: 'pH',
      severity: 'warning',
      recommendation: 'Inspect source for acidic runoff or metal leaching; water may corrode pipes and cause metallic taste.',
      explanationTemplate: 'pH level is below the recommended minimum threshold of 6.5 pH. Acidic water may cause corrosion and irritation.',
      reference: 'WHO Guidelines for Drinking-water Quality 4th Ed.',
      updatedBy: admin._id,
    },
    {
      parameter: 'ph',
      parameterName: 'High pH (Alkaline)',
      comparisonOperator: '>',
      threshold: 8.5,
      unit: 'pH',
      severity: 'warning',
      recommendation: 'Inspect source for mineral contamination; high alkalinity reduces chlorination disinfection efficacy.',
      explanationTemplate: 'pH level exceeds the recommended upper threshold of 8.5 pH. Disinfection efficiency is significantly degraded.',
      reference: 'WHO Guidelines for Drinking-water Quality 4th Ed.',
      updatedBy: admin._id,
    },
    {
      parameter: 'turbidity',
      parameterName: 'Elevated Turbidity',
      comparisonOperator: '>',
      threshold: 5.0,
      unit: 'NTU',
      severity: 'warning',
      recommendation: 'Perform filtration, flocculation, or settle water before chemical disinfection. High cloudiness shelters microbes.',
      explanationTemplate: 'Turbidity exceeds 5.0 NTU. Particulate matter impairs chlorine disinfection and can shelter bacterial pathogens.',
      reference: 'BIS IS 10500:2012 / WHO Guidelines',
      updatedBy: admin._id,
    },
    {
      parameter: 'tds',
      parameterName: 'High Total Dissolved Solids',
      comparisonOperator: '>',
      threshold: 500,
      unit: 'mg/L',
      severity: 'informational',
      recommendation: 'Monitor mineral content. Values over 500 mg/L may have unpalatable taste or excessive mineral hardness.',
      explanationTemplate: 'Total dissolved solids (TDS) exceed the desirable threshold of 500 mg/L.',
      reference: 'BIS IS 10500:2012 Acceptable Limit',
      updatedBy: admin._id,
    },
    {
      parameter: 'chlorine',
      parameterName: 'Insufficient Residual Chlorine',
      comparisonOperator: '<',
      threshold: 0.2,
      unit: 'mg/L',
      severity: 'warning',
      recommendation: 'Increase chlorination dosage to ensure secondary disinfection during storage and distribution.',
      explanationTemplate: 'Free residual chlorine is less than 0.2 mg/L, leaving treated water vulnerable to microbial re-contamination.',
      reference: 'WHO Technical Notes for Drinking-water Disinfection',
      updatedBy: admin._id,
    },
    {
      parameter: 'ecoli',
      parameterName: 'Fecal Coliform / E. coli Detection',
      comparisonOperator: '>',
      threshold: 0,
      unit: 'CFU/100mL',
      severity: 'critical_review',
      recommendation: 'Immediate precautionary advisory: Boil water before drinking. Investigate sewage or pit-latrine intrusion.',
      explanationTemplate: 'Microbiological indicator E. coli detected (>0 CFU/100mL). Suggests recent fecal contamination and severe disease risk.',
      reference: 'WHO Microbiological Safety Standard (0 E. coli per 100 mL)',
      updatedBy: admin._id,
    },
    {
      parameter: 'nitrate',
      parameterName: 'Elevated Nitrate',
      comparisonOperator: '>',
      threshold: 50,
      unit: 'mg/L',
      severity: 'high_priority',
      recommendation: 'Prohibit feeding to infants (risk of methemoglobinemia). Check nearby agricultural fertilizer runoff.',
      explanationTemplate: 'Nitrate concentration exceeds 50 mg/L. Poses significant health risk to infants and pregnant women.',
      reference: 'WHO Guidelines for Drinking-water Quality',
      updatedBy: admin._id,
    },
  ];
  await RiskRule.insertMany(rulesData);

  // Sources
  const sourcesData = [
    {
      name: 'Community Hand Pump #1',
      type: 'hand_pump',
      village: 'Rampur',
      address: 'Near Gram Panchayat Office, Main Square',
      coordinates: { latitude: 19.0760, longitude: 73.0230 },
      description: 'Installed in 2021 by Rural Water Supply Board. Serves approximately 60 households.',
      status: 'active',
      state: 'Maharashtra',
      district: 'Raigad',
      taluka: 'Khalapur',
      riskLevel: 'SAFE',
      servingPopulation: 350,
      createdBy: admin._id,
    },
    {
      name: 'Primary School Borewell',
      type: 'borewell',
      village: 'Rampur',
      address: 'Government Upper Primary School Compound',
      coordinates: { latitude: 19.0785, longitude: 73.0255 },
      description: 'Deep borewell equipped with submerged electric pump and elevated storage tank.',
      status: 'active',
      state: 'Maharashtra',
      district: 'Raigad',
      taluka: 'Khalapur',
      riskLevel: 'SAFE',
      servingPopulation: 500,
      createdBy: healthWorker._id,
    },
    {
      name: 'West Ward Open Well',
      type: 'open_well',
      village: 'Rampur',
      address: 'Behind Hanuman Mandir, West Ward',
      coordinates: { latitude: 19.0730, longitude: 73.0210 },
      description: 'Traditional masonry well. Parapet wall repaired in 2023. Vulnerable to monsoon surface runoff.',
      status: 'under_inspection',
      state: 'Maharashtra',
      district: 'Raigad',
      taluka: 'Khalapur',
      riskLevel: 'HIGH_RISK',
      lastTestResult: 'E. coli detected after monsoon runoff',
      servingPopulation: 180,
      createdBy: healthWorker._id,
    },
    {
      name: 'Sunderpur Community Tap Stand',
      type: 'public_tap',
      village: 'Sunderpur',
      address: 'Bazaar Road, near Bus Stop',
      coordinates: { latitude: 19.0910, longitude: 73.0420 },
      description: 'Piped water distribution standpost supplied by the regional feeder reservoir.',
      status: 'active',
      state: 'Maharashtra',
      district: 'Raigad',
      taluka: 'Khalapur',
      riskLevel: 'WARNING',
      servingPopulation: 650,
      createdBy: admin._id,
    },
    {
      name: 'South Hamlet Deep Borewell',
      type: 'borewell',
      village: 'Sunderpur',
      address: 'South Agricultural Hamlet, Ward 3',
      coordinates: { latitude: 19.0880, longitude: 73.0390 },
      description: 'Deep drilled aquifer water source with solar-powered pump.',
      status: 'active',
      state: 'Maharashtra',
      district: 'Raigad',
      taluka: 'Khalapur',
      riskLevel: 'SAFE',
      servingPopulation: 220,
      createdBy: healthWorker._id,
    },
    {
      name: 'Devgarh Hill Spring Reservoir',
      type: 'water_tank',
      village: 'Devgarh',
      address: 'Upper Ridge Catchment Tank',
      coordinates: { latitude: 19.0620, longitude: 73.0120 },
      description: 'Gravity-fed storage reservoir collecting spring water from the protected ridge.',
      status: 'active',
      state: 'Maharashtra',
      district: 'Raigad',
      taluka: 'Khalapur',
      type: 'reservoir',
      capacity: '2 lakh litres',
      riskLevel: 'SAFE',
      servingPopulation: 800,
      createdBy: admin._id,
    },
    {
      name: 'Bheemtal Old Public Tank',
      type: 'water_tank',
      village: 'Bheemtal',
      address: 'East Gate of Bheemtal lake boundary',
      coordinates: { latitude: 19.0510, longitude: 73.0040 },
      description: 'Masonry storage structure. Needs chlorination dosing repair.',
      status: 'temporarily_unavailable',
      state: 'Maharashtra',
      district: 'Raigad',
      taluka: 'Khalapur',
      capacity: '80,000 litres',
      riskLevel: 'WARNING',
      servingPopulation: 420,
      createdBy: healthWorker._id,
    },
    {
      name: 'Village Tank 01',
      type: 'water_tank',
      village: 'Khadakwasla',
      taluka: 'Haveli',
      district: 'Pune',
      state: 'Maharashtra',
      address: 'Near village panchayat, Khadakwasla',
      coordinates: { latitude: 18.4422, longitude: 73.7714 },
      description: 'Demo elevated drinking-water tank serving the village cluster.',
      status: 'active',
      capacity: '1.5 lakh litres',
      riskLevel: 'SAFE',
      lastTestDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      lastTestResult: 'Within BIS acceptable limits',
      servingPopulation: 900,
      isDemo: true,
      createdBy: admin._id,
    },
    {
      name: 'Pune Cantonment Public Tap',
      type: 'public_tap',
      village: 'Pune',
      taluka: 'Haveli',
      district: 'Pune',
      state: 'Maharashtra',
      address: 'Shivaji Nagar ward standpost',
      coordinates: { latitude: 18.5308, longitude: 73.8475 },
      status: 'active',
      riskLevel: 'SAFE',
      isDemo: true,
      createdBy: admin._id,
    },
    {
      name: 'Nashik Godavari Community Tank',
      type: 'water_tank',
      village: 'Panchavati',
      taluka: 'Nashik',
      district: 'Nashik',
      state: 'Maharashtra',
      address: 'Near Godavari ghat service lane',
      coordinates: { latitude: 20.0063, longitude: 73.791 },
      status: 'active',
      capacity: '2 lakh litres',
      riskLevel: 'WARNING',
      lastTestResult: 'Low residual chlorine',
      isDemo: true,
      createdBy: healthWorker._id,
    },
    {
      name: 'Nagpur Orange City Borewell',
      type: 'borewell',
      village: 'Dharampeth',
      district: 'Nagpur',
      state: 'Maharashtra',
      address: 'Ward 12 community plot',
      coordinates: { latitude: 21.1458, longitude: 79.0882 },
      status: 'active',
      riskLevel: 'SAFE',
      isDemo: true,
      createdBy: admin._id,
    },
    {
      name: 'Kolhapur Panchganga Hand Pump',
      type: 'hand_pump',
      village: 'Shivaji Udyan',
      district: 'Kolhapur',
      state: 'Maharashtra',
      coordinates: { latitude: 16.705, longitude: 74.2433 },
      status: 'active',
      riskLevel: 'UNKNOWN',
      isDemo: true,
      createdBy: healthWorker._id,
    },
    {
      name: 'Satara Hill Reservoir',
      type: 'reservoir',
      village: 'Satara',
      district: 'Satara',
      state: 'Maharashtra',
      coordinates: { latitude: 17.6805, longitude: 74.0183 },
      capacity: '5 lakh litres',
      status: 'active',
      riskLevel: 'SAFE',
      isDemo: true,
      createdBy: admin._id,
    },
    {
      name: 'Ahilyanagar Market Well',
      type: 'open_well',
      village: 'Ahilyanagar',
      district: 'Ahilyanagar',
      state: 'Maharashtra',
      coordinates: { latitude: 19.0948, longitude: 74.748 },
      status: 'under_inspection',
      riskLevel: 'WARNING',
      isDemo: true,
      createdBy: healthWorker._id,
    },
    {
      name: 'Solapur Siddeshwar Tank',
      type: 'water_tank',
      village: 'Solapur',
      district: 'Solapur',
      state: 'Maharashtra',
      coordinates: { latitude: 17.6599, longitude: 75.9064 },
      status: 'active',
      riskLevel: 'SAFE',
      isDemo: true,
      createdBy: admin._id,
    },
    {
      name: 'Raigad Alibag Public Tap',
      type: 'public_tap',
      village: 'Alibag',
      district: 'Raigad',
      state: 'Maharashtra',
      coordinates: { latitude: 18.6414, longitude: 72.8722 },
      status: 'active',
      riskLevel: 'SAFE',
      isDemo: true,
      createdBy: admin._id,
    },
    {
      name: 'Mulshi Dam Community Source',
      type: 'community_water_source',
      village: 'Mulshi',
      taluka: 'Mulshi',
      district: 'Pune',
      state: 'Maharashtra',
      coordinates: { latitude: 18.4913, longitude: 73.5089 },
      status: 'active',
      riskLevel: 'UNKNOWN',
      isDemo: true,
      createdBy: admin._id,
    },
    {
      name: 'Ahmedabad Sabarmati Hand Pump',
      type: 'hand_pump',
      village: 'Sabarmati',
      district: 'Ahmedabad',
      state: 'Gujarat',
      coordinates: { latitude: 23.0395, longitude: 72.566 },
      status: 'active',
      riskLevel: 'SAFE',
      isDemo: true,
      createdBy: admin._id,
    },
    {
      name: 'Bengaluru Hebbal Tank',
      type: 'water_tank',
      village: 'Hebbal',
      district: 'Bengaluru Urban',
      state: 'Karnataka',
      coordinates: { latitude: 13.0358, longitude: 77.597 },
      status: 'active',
      riskLevel: 'WARNING',
      isDemo: true,
      createdBy: admin._id,
    },
    {
      name: 'Jaipur Amer Fort Well',
      type: 'open_well',
      village: 'Amer',
      district: 'Jaipur',
      state: 'Rajasthan',
      coordinates: { latitude: 26.9855, longitude: 75.8513 },
      status: 'active',
      riskLevel: 'UNKNOWN',
      isDemo: true,
      createdBy: admin._id,
    },
    {
      name: 'Bhopal Upper Lake Intake',
      type: 'reservoir',
      village: 'Bhopal',
      district: 'Bhopal',
      state: 'Madhya Pradesh',
      coordinates: { latitude: 23.2599, longitude: 77.4126 },
      status: 'under_inspection',
      riskLevel: 'WARNING',
      isDemo: true,
      createdBy: admin._id,
    },
    {
      name: 'Lucknow Gomti Nagar Borewell',
      type: 'borewell',
      village: 'Gomti Nagar',
      district: 'Lucknow',
      state: 'Uttar Pradesh',
      coordinates: { latitude: 26.8467, longitude: 80.9462 },
      status: 'active',
      riskLevel: 'SAFE',
      isDemo: true,
      createdBy: admin._id,
    },
    {
      name: 'Patna Ganga Ghat Hand Pump',
      type: 'hand_pump',
      village: 'Patna City',
      district: 'Patna',
      state: 'Bihar',
      coordinates: { latitude: 25.5941, longitude: 85.1376 },
      status: 'active',
      riskLevel: 'HIGH_RISK',
      lastTestResult: 'Demo high-risk marker for training',
      isDemo: true,
      createdBy: admin._id,
    },
    {
      name: 'Kolkata Howrah Public Tap',
      type: 'public_tap',
      village: 'Howrah',
      district: 'Howrah',
      state: 'West Bengal',
      coordinates: { latitude: 22.5958, longitude: 88.2636 },
      status: 'active',
      riskLevel: 'SAFE',
      isDemo: true,
      createdBy: admin._id,
    },
    {
      name: 'Chennai T Nagar Overhead Tank',
      type: 'water_tank',
      village: 'T Nagar',
      district: 'Chennai',
      state: 'Tamil Nadu',
      coordinates: { latitude: 13.0418, longitude: 80.2341 },
      status: 'active',
      riskLevel: 'SAFE',
      isDemo: true,
      createdBy: admin._id,
    },
    {
      name: 'Kochi Fort Community Well',
      type: 'open_well',
      village: 'Fort Kochi',
      district: 'Ernakulam',
      state: 'Kerala',
      coordinates: { latitude: 9.9658, longitude: 76.2421 },
      status: 'active',
      riskLevel: 'UNKNOWN',
      isDemo: true,
      createdBy: admin._id,
    },
  ];
  const sources = await WaterSource.insertMany(sourcesData);

  // Tests
  const testRecords = [
    {
      sourceId: sources[0]._id,
      testedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      testingMethod: 'field_kit',
      laboratory: 'District Mobile Water Lab',
      testerId: healthWorker._id,
      testerName: healthWorker.name,
      verificationStatus: 'verified',
      notes: 'Quarterly field inspection. Water clear and odorless.',
      parameters: [
        { parameter: 'ph', name: 'pH Value', value: 7.2, unit: 'pH' },
        { parameter: 'turbidity', name: 'Turbidity', value: 1.8, unit: 'NTU' },
        { parameter: 'tds', name: 'Total Dissolved Solids', value: 340, unit: 'mg/L' },
        { parameter: 'ecoli', name: 'E. coli Indicator', value: 0, unit: 'CFU/100mL' },
      ],
    },
    {
      sourceId: sources[2]._id,
      testedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      testingMethod: 'laboratory',
      laboratory: 'Public Health Engineering Dept Laboratory',
      testerId: healthWorker._id,
      testerName: healthWorker.name,
      verificationStatus: 'reviewed',
      notes: 'Follow-up inspection after heavy monsoon rain report.',
      parameters: [
        { parameter: 'ph', name: 'pH Value', value: 6.8, unit: 'pH' },
        { parameter: 'turbidity', name: 'Turbidity', value: 8.4, unit: 'NTU' },
        { parameter: 'tds', name: 'Total Dissolved Solids', value: 410, unit: 'mg/L' },
        { parameter: 'ecoli', name: 'E. coli Indicator', value: 12, unit: 'CFU/100mL' },
      ],
    },
    {
      sourceId: sources[3]._id,
      testedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      testingMethod: 'digital_probe',
      laboratory: 'Zilla Parishad Field Team',
      testerId: healthWorker._id,
      testerName: healthWorker.name,
      verificationStatus: 'pending',
      notes: 'Spot test at distribution terminus. Residual chlorine low.',
      parameters: [
        { parameter: 'ph', name: 'pH Value', value: 7.6, unit: 'pH' },
        { parameter: 'turbidity', name: 'Turbidity', value: 2.1, unit: 'NTU' },
        { parameter: 'chlorine', name: 'Free Residual Chlorine', value: 0.08, unit: 'mg/L' },
      ],
    },
  ];

  for (const testData of testRecords) {
    const test = await WaterTest.create(testData);
    const src = sources.find((s) => s._id.toString() === test.sourceId.toString());
    if (src) {
      src.lastTestedAt = test.testedAt;
      await src.save();
      await evaluateWaterTest(test, src);
    }
  }

  // Reports
  const reportsData = [
    {
      referenceId: 'SD-2026-000101',
      reporterId: villager._id,
      fullName: villager.name,
      phone: '9833344455',
      email: villager.email,
      sourceId: sources[2]._id,
      waterSourceId: sources[2]._id,
      waterSourceName: sources[2].name,
      waterSourceType: sources[2].type,
      village: 'Rampur',
      taluka: 'Khalapur',
      district: 'Raigad',
      state: 'Maharashtra',
      address: 'Near Hanuman temple pathway',
      locationDescription: 'Near Hanuman temple pathway',
      category: 'unusual_color',
      concerns: ['water_discoloration', 'dirty_or_muddy_water'],
      description: 'The well water turned noticeably brownish and cloudy after yesterday evening’s torrential rain. Strong muddy smell.',
      observedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      reportedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      status: 'UNDER_REVIEW',
      officialSubmissionStatus: 'READY_FOR_OFFICIAL_SUBMISSION',
      assignedDepartment: 'Maharashtra Public Health Laboratory',
      routingCategory: 'public_health',
      assignedReviewer: healthWorker._id,
      internalNotes: [
        {
          note: 'Inspected well structure. Surface drainage barrier appears breached on the southern rim.',
          authorId: healthWorker._id,
          authorName: healthWorker.name,
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
      ],
      publicResponse: 'Health worker inspected this well. Water sample dispatched for bacteriological testing. Villagers advised to boil before consumption.',
    },
    {
      referenceId: 'SD-2026-000102',
      reporterId: villager2._id,
      fullName: villager2.name,
      phone: '9844455566',
      email: villager2.email,
      sourceId: sources[3]._id,
      waterSourceId: sources[3]._id,
      waterSourceName: sources[3].name,
      waterSourceType: sources[3].type,
      village: 'Sunderpur',
      district: 'Raigad',
      state: 'Maharashtra',
      address: 'Main market bus stop standpost',
      locationDescription: 'Main market bus stop standpost',
      category: 'damaged_infrastructure',
      concerns: ['water_source_not_functioning'],
      description: 'The tap brass fitting is broken and leaking continuously. Water pooling around the base creating stagnant muddy puddle.',
      observedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      reportedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      status: 'IN_PROGRESS',
      officialSubmissionStatus: 'READY_FOR_OFFICIAL_SUBMISSION',
      assignedDepartment: 'Local Water Supply / Municipal Authority',
      routingCategory: 'municipal',
      assignedReviewer: healthWorker._id,
      internalNotes: [
        {
          note: 'Forwarded repair work order to village plumber.',
          authorId: healthWorker._id,
          authorName: healthWorker.name,
          createdAt: new Date(),
        },
      ],
      publicResponse: 'Plumbing requisition initiated with Gram Panchayat engineer.',
    },
    {
      referenceId: 'SD-2026-000103',
      reporterId: villager._id,
      fullName: villager.name,
      phone: '9833344455',
      email: villager.email,
      sourceId: null,
      village: 'Rampur',
      district: 'Raigad',
      state: 'Maharashtra',
      address: 'Drainage channel crossing north culvert',
      locationDescription: 'Drainage channel crossing north culvert',
      category: 'sewage_leakage',
      concerns: ['sewage_near_water_source'],
      description: 'Overflowing open drain near the agricultural bund. Smells foul and is dangerously close to drinking water pipelines.',
      observedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      reportedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      status: 'NEW',
      officialSubmissionStatus: 'READY_FOR_OFFICIAL_SUBMISSION',
      assignedDepartment: 'Local Sanitation / Municipal Authority',
      routingCategory: 'sanitation',
    },
  ];
  await CommunityReport.insertMany(reportsData);
  await ReportSequence.create({ year: 2026, seq: 103 });

  await GovernmentDepartment.insertMany([
    {
      departmentName: 'Maharashtra Public Health Department',
      state: 'Maharashtra',
      district: '',
      category: 'public_health',
      officialApiEndpoint: '',
      enabled: true,
      contactInformation: 'Demo routing record. No live government API is connected.',
    },
    {
      departmentName: 'Local Water Supply / Municipal Authority',
      state: 'Maharashtra',
      district: '',
      category: 'municipal',
      enabled: true,
      contactInformation: 'Demo routing for damaged tanks and municipal assets.',
    },
    {
      departmentName: 'Local Sanitation Authority',
      state: '',
      district: '',
      category: 'sanitation',
      enabled: true,
      contactInformation: 'National fallback routing for sewage-related reports.',
    },
    {
      departmentName: 'State Water Supply Board',
      state: '',
      district: '',
      category: 'water_supply',
      enabled: true,
      contactInformation: 'Fallback water-supply routing. Official API not configured.',
    },
  ]);

  // Alerts
  const alertsData = [
    {
      title: 'Boil Water Advisory - West Ward Open Well',
      message: 'Recent microbiological analysis showed bacterial indicators above acceptable limits following heavy rains. Do not drink untreated water from this well.',
      severity: 'high',
      affectedSourceIds: [sources[2]._id],
      affectedVillage: 'Rampur',
      recommendedAction: 'Bring water to a rolling boil for at least 1 full minute, or use approved chlorine tablets before drinking and food preparation.',
      supportingReference: 'District Health Lab Report #DHL-2026-88',
      issuedBy: admin._id,
      status: 'published',
      publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      expiresAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      updateHistory: [
        {
          updatedBy: admin._id,
          updatedAt: new Date(),
          note: 'Issued public boil advisory following confirmed E. coli presence.',
        },
      ],
    },
    {
      title: 'Chlorination Maintenance Notice',
      message: 'Routine pipeline flushing and shock chlorination will be carried out this Saturday between 9:00 AM and 2:00 PM across Sunderpur.',
      severity: 'low',
      affectedSourceIds: [sources[3]._id],
      affectedVillage: 'Sunderpur',
      recommendedAction: 'Store sufficient drinking water in advance. Allow tap to run for 2 minutes after service resumption before use.',
      supportingReference: 'Village Water Committee Notice 04/26',
      issuedBy: admin._id,
      status: 'published',
      publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    },
  ];
  await SafetyAlert.insertMany(alertsData);

  // Articles
  const articlesData = [
    {
      title: 'Understanding Cholera: Prevention and Early Response',
      slug: 'understanding-cholera-prevention-and-early-response',
      summary: 'Cholera is an acute diarrheal infection caused by ingestion of food or water contaminated with the bacterium Vibrio cholerae. Learn key symptoms and home rehydration steps.',
      category: 'cholera',
      language: 'en',
      content: `Cholera remains a major global threat to public health and an indicator of inequity and lack of social development. The infection is often mild or without symptoms, but can be severe and life-threatening within hours if left untreated.

### Key Facts
- Spread primarily through water contaminated with fecal matter from an infected person.
- Severe cases present with acute watery diarrhea ("rice-water stools") and severe dehydration.
- Early administration of Oral Rehydration Salts (ORS) saves over 99% of patients.
- Safe water, sanitation, and hygiene (WASH) are the only sustainable solutions.`,
      transmissionInfo: 'Ingestion of water or food contaminated directly or indirectly with feces of infected persons. Raw or undercooked seafood harvested from contaminated waters is also a common route.',
      preventionGuidance: '1. Drink only boiled, treated, or bottled water.\n2. Wash hands thoroughly with soap after using the toilet and before preparing food.\n3. Cook food thoroughly and eat it while hot.\n4. Protect household water storage vessels with clean, tight-fitting lids.',
      warningSigns: 'Sudden onset of profuse, painless watery diarrhea; vomiting; rapid dehydration evidenced by dry mouth, extreme thirst, sunken eyes, and low blood pressure. Seek immediate medical attention at the nearest health centre.',
      references: [
        'World Health Organization (WHO) Cholera Fact Sheet',
        'Centers for Disease Control and Prevention (CDC) Cholera Treatment Guidelines',
      ],
      reviewedBy: admin._id,
      status: 'published',
    },
    {
      title: 'Typhoid Fever: Risks, Contamination, and Safe Practices',
      slug: 'typhoid-fever-risks-contamination-and-safe-practices',
      summary: 'Typhoid fever is caused by Salmonella Typhi bacteria transmitted through contaminated food and water. Explore transmission pathways and community prevention.',
      category: 'typhoid',
      language: 'en',
      content: `Typhoid fever is a systemic infection caused by the bacterium Salmonella enterica serotype Typhi. It occurs predominantly in areas with poor sanitation and lack of clean drinking water.

### Symptoms and Course
- Prolonged high fever, fatigue, headache, abdominal pain, and constipation or diarrhea.
- Some patients develop a rash called "rose spots" on the trunk.
- Without prompt antibiotic treatment, severe complications including intestinal perforation can occur.`,
      transmissionInfo: 'Fecal-oral transmission occurs when food or drinking water is contaminated by sewage or handled by an infected individual without proper hand hygiene.',
      preventionGuidance: '1. Ensure all drinking water is properly disinfected by boiling or chlorination.\n2. Avoid raw unpeeled vegetables and street-vendor ice.\n3. Promote vaccination in high-risk rural areas.\n4. Ensure latrines are located at least 30 metres away from drinking-water wells.',
      warningSigns: 'Persistent unexplained fever rising day-by-day, abdominal tenderness, extreme exhaustion, and mental confusion. Medical evaluation and blood/stool culture are necessary for accurate diagnosis.',
      references: [
        'WHO Typhoid Guidelines for Diagnosis and Management',
        'National Health Mission Waterborne Disease Protocol',
      ],
      reviewedBy: admin._id,
      status: 'published',
    },
    {
      title: 'Safe Household Drinking Water Storage Guide',
      slug: 'safe-household-drinking-water-storage-guide',
      summary: 'Even safe water collected from an unpolluted source can become contaminated in the home. Learn proper container selection, cleaning, and dispensing hygiene.',
      category: 'water_storage',
      language: 'en',
      content: `Studies consistently show that microbiological water quality degrades between the point of collection and the point of consumption. Household re-contamination is responsible for up to 40% of childhood diarrheal cases in rural communities.

### The Golden Rules of Water Storage:
1. **Narrow-Neck Vessels**: Use storage containers with narrow openings or taps rather than wide-mouthed buckets.
2. **Never Dip Hands**: Never use an unsterilized cup, mug, or hands to scoop water out of the vessel.
3. **Dedicated Cleaning Schedule**: Scrub storage pots weekly with clean water and mild detergent; dry thoroughly in direct sunlight.
4. **Elevate Containers**: Keep storage vessels raised at least 2 feet above ground level, away from pets, livestock, and floor dust.`,
      transmissionInfo: 'Secondary microbial contamination via dirty hands, shared cups, open containers, dust, and animal contact.',
      preventionGuidance: 'Adopt the "Pour or Tap" method: Only dispense water through a fitted tap or by tilting the jug. Never allow fingers to contact the water surface.',
      warningSigns: 'Slimy biofilm inside storage container walls, floating debris, cloudy appearance, or unusual taste indicate necessary immediate cleaning and disinfection.',
      references: [
        'WHO Guidelines for Household Water Treatment and Safe Storage (HWTS)',
        'UNICEF Rural Water Storage Best Practices',
      ],
      reviewedBy: admin._id,
      status: 'published',
    },
    {
      title: 'Effective Household Water Treatment: Boiling, Chlorination & Filtration',
      slug: 'effective-household-water-treatment',
      summary: 'Practical, evidence-based methods for treating drinking water at home to eliminate common waterborne pathogens and protect family health.',
      category: 'water_treatment',
      language: 'en',
      content: `When a water source is suspect or unverified, effective household water treatment provides a vital safety barrier.

### 1. Boiling
- The most reliable method of killing all classes of disease-causing organisms (viruses, bacteria, protozoan parasites).
- Bring water to a vigorous, rolling boil for at least 1 full minute (3 minutes at high altitude).
- Allow to cool naturally in the same covered container.

### 2. Chlorination
- Highly effective against bacteria and viruses.
- Use certified sodium hypochlorite solution or chlorine tablets (follow manufacturer instructions, typically 2-4 drops per litre for 30 minutes contact time).
- Note: High turbidity reduces chlorine efficacy, so filter turbid water first.

### 3. Ceramic and Biosand Filtration
- Removes physical particles, parasites, and substantial bacteria.
- Must be combined with post-filtration disinfection for complete microbiological safety.`,
      transmissionInfo: 'Raw untreated surface water or damaged groundwater systems containing microbial pathogens.',
      preventionGuidance: 'Select the treatment method best suited to your available resources. If water is cloudy, always allow it to settle or pass through a clean cloth before boiling or chlorinating.',
      warningSigns: 'Drinking untreated water from open wells or unmonitored streams carries severe acute disease risks.',
      references: [
        'WHO Domestic Water Treatment Manual',
        'CDC Safe Water System (SWS) Technical Guidance',
      ],
      reviewedBy: admin._id,
      status: 'published',
    },
  ];
  await DiseaseArticle.insertMany(articlesData);

  // Notifications
  await Notification.create([
    {
      userId: healthWorker._id,
      title: 'Water Risk Flag Created: E. coli Detected',
      message: 'West Ward Open Well in Rampur recorded E. coli = 12 CFU/100mL. Immediate precautionary review required.',
      type: 'risk_flag',
    },
    {
      userId: villager._id,
      title: 'Advisory: Boil Water Advisory Published',
      message: 'A boil water advisory has been published for Rampur. Please review recommended safety precautions.',
      type: 'safety_alert',
    },
  ]);
};

module.exports = runSeed;

