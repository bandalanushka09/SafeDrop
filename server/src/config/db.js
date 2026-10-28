const mongoose = require('mongoose');

let memoryServer = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/safedrop';
  const forceMemory = process.env.USE_MEMORY_DB === 'true';

  if (!forceMemory) {
    try {
      console.log(`[Database] Attempting connection to MongoDB at: ${uri}`);
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 2500, // Quick timeout to fallback if local mongod is not running
      });
      console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
      return conn;
    } catch (err) {
      console.warn(`[Database] Could not connect to external MongoDB: ${err.message}`);
      console.log('[Database] Initializing MongoDB In-Memory Server fallback for local environment...');
    }
  }

  // Fallback to MongoMemoryServer
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create();
    const memUri = memoryServer.getUri();
    const conn = await mongoose.connect(memUri);
    console.log(`[Database] In-Memory MongoDB Connected at: ${memUri}`);
    return conn;
  } catch (memErr) {
    console.error(`[Database] Failed to initialize in-memory MongoDB: ${memErr.message}`);
    throw memErr;
  }
};

const disconnectDB = async () => {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
  }
};

module.exports = { connectDB, disconnectDB };

