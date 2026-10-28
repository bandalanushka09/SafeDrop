const crypto = require('crypto');

const jwtSecret =
  process.env.JWT_SECRET ||
  (process.env.NODE_ENV === 'test' ? crypto.randomBytes(32).toString('hex') : '');

if (jwtSecret.length < 32) {
  throw new Error('JWT_SECRET must be set to a value with at least 32 characters.');
}

module.exports = jwtSecret;
