require('dotenv').config();
const http = require('http');
const app = require('./app');
const { connectDB } = require('./config/db');
const User = require('./models/User');

const PORT = process.env.PORT || 5000;

const autoSeedIfEmpty = async () => {
  try {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      if (process.env.NODE_ENV === 'production') {
        console.warn('[SafeDrop Server] Database is empty. Automatic demo seeding is disabled in production.');
        return;
      }
      console.log('[SafeDrop Server] Database is empty. Auto-seeding initial baseline demo records and admin...');
      // Execute demo seed in-process
      const seedScript = require('../scripts/seedDemoDataInternal');
      await seedScript();
    } else {
      console.log(`[SafeDrop Server] Database active with ${userCount} registered user(s).`);
    }
  } catch (err) {
    console.warn('[SafeDrop Server] Auto-seed check notice:', err.message);
  }
};

const startServer = async () => {
  try {
    await connectDB();
    await autoSeedIfEmpty();

    const server = http.createServer(app);

    server.listen(PORT, () => {
      console.log(`[SafeDrop Server] Running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
      console.log(`[SafeDrop Server] Health check available at: http://localhost:${PORT}/api/health`);
    });

    const shutdown = async () => {
      console.log('\n[SafeDrop Server] Shutting down gracefully...');
      server.close(() => {
        console.log('[SafeDrop Server] Process terminated.');
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (err) {
    console.error('[SafeDrop Server] Startup failure:', err.message);
    process.exit(1);
  }
};

startServer();
