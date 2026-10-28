require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { connectDB, disconnectDB } = require('../src/config/db');
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
const GovernmentDepartment = require('../src/models/GovernmentDepartment');
const ReportSequence = require('../src/models/ReportSequence');
const runSeed = require('./seedDemoDataInternal');

const seedDemoData = async () => {
  try {
    console.log('[SeedDemo] Connecting to database...');
    await connectDB();

    console.log('[SeedDemo] Cleaning existing collections for clean seed...');
    await Promise.all([
      User.deleteMany({}),
      WaterSource.deleteMany({}),
      WaterTest.deleteMany({}),
      CommunityReport.deleteMany({}),
      RiskRule.deleteMany({}),
      RiskFlag.deleteMany({}),
      SafetyAlert.deleteMany({}),
      DiseaseArticle.deleteMany({}),
      Village.deleteMany({}),
      Notification.deleteMany({}),
      GovernmentDepartment.deleteMany({}),
      ReportSequence.deleteMany({}),
    ]);

    await runSeed();
    console.log('[SeedDemo] Demo data loaded. Demo government records are routing placeholders only.');
    await disconnectDB();
    process.exit(0);
  } catch (err) {
    console.error('[SeedDemo] Failed:', err);
    await disconnectDB();
    process.exit(1);
  }
};

seedDemoData();
