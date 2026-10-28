require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../src/config/db');
const User = require('../src/models/User');

const seedAdmin = async () => {
  try {
    const password = process.env.ADMIN_INITIAL_PASSWORD;
    if (!password || password.length < 12) {
      throw new Error('Set ADMIN_INITIAL_PASSWORD to a unique value with at least 12 characters.');
    }

    console.log('[SeedAdmin] Connecting to database...');
    await connectDB();

    const email = (process.env.ADMIN_INITIAL_EMAIL || 'admin@safedrop.org').toLowerCase().trim();
    const name = process.env.ADMIN_INITIAL_NAME || 'System Administrator';
    const village = process.env.ADMIN_INITIAL_VILLAGE || 'Central District';

    let admin = await User.findOne({ email });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    if (admin) {
      console.log(`[SeedAdmin] User with email ${email} already exists. Ensuring admin role and active status...`);
      admin.role = 'admin';
      admin.accountStatus = 'active';
      admin.passwordHash = passwordHash;
      await admin.save();
      console.log(`[SeedAdmin] Existing user updated to Administrator.`);
    } else {
      admin = new User({
        name,
        email,
        passwordHash,
        role: 'admin',
        village,
        preferredLanguage: 'en',
        accountStatus: 'active',
      });
      await admin.save();
      console.log(`[SeedAdmin] Initial Administrator created successfully.`);
    }

  } catch (err) {
    console.error('[SeedAdmin] Error bootstrapping admin:', err.message);
    process.exitCode = 1;
  } finally {
    await disconnectDB();
  }
};

seedAdmin();
