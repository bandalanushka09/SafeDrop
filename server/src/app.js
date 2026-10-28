const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
const { apiLimiter } = require('./middleware/rateLimiter');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const sourceRoutes = require('./routes/sourceRoutes');
const testRoutes = require('./routes/testRoutes');
const reportRoutes = require('./routes/reportRoutes');
const riskRoutes = require('./routes/riskRoutes');
const alertRoutes = require('./routes/alertRoutes');
const articleRoutes = require('./routes/articleRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const auditRoutes = require('./routes/auditRoutes');
const villageRoutes = require('./routes/villageRoutes');
const settingRoutes = require('./routes/settingRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const locationRoutes = require('./routes/locationRoutes');
const governmentRoutes = require('./routes/governmentRoutes');

const app = express();

// Security headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
app.use(
  cors({
    origin: corsOrigin === '*' ? '*' : [corsOrigin, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  })
);

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static uploads folder
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// General rate limiter for API routes
app.use('/api', apiLimiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    application: 'SafeDrop API',
    tagline: 'Safe Water. Healthy Villages.',
    timestamp: new Date().toISOString(),
  });
});

// Mount modular API routes matching exact specs
app.use('/api/auth', authRoutes);
app.use('/api', userRoutes); // Mounts /api/users/me and /api/admin/users
app.use('/api', auditRoutes); // Mounts /api/admin/audit-logs
app.use('/api/water-sources', sourceRoutes);
app.use('/api/water-tests', testRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/risk', riskRoutes);

// Direct alias routes as specified in prompt section 22:
app.use('/api/risk-rules', (req, res, next) => {
  req.url = '/rules' + req.url;
  riskRoutes(req, res, next);
});
app.use('/api/risk-flags', (req, res, next) => {
  req.url = '/flags' + req.url;
  riskRoutes(req, res, next);
});

app.use('/api/alerts', alertRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/villages', villageRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/government', governmentRoutes);

// Serve compiled frontend in production or if dist exists
const clientDistPath = path.join(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Catch 404 for API endpoints
app.use(notFoundHandler);

// Centralized error handling
app.use(errorHandler);

module.exports = app;
