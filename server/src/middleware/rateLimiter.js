const rateLimit = require('express-rate-limit');

const skipInTest = (req) => process.env.NODE_ENV === 'test';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.',
  },
  skip: skipInTest,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many API requests from this client. Please slow down.',
  },
  skip: skipInTest,
});

const publicReportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many report submissions from this network. Please wait before sending another report.',
  },
  skip: skipInTest,
});

const publicUploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many photo uploads from this network. Please wait and try again.',
  },
  skip: skipInTest,
});

const locationLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many location searches. Please wait a moment.',
  },
  skip: skipInTest,
});

module.exports = {
  authLimiter,
  apiLimiter,
  publicReportLimiter,
  publicUploadLimiter,
  locationLimiter,
};
