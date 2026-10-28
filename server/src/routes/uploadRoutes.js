const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { authenticate } = require('../middleware/auth');
const { publicUploadLimiter } = require('../middleware/rateLimiter');

const handleUpload = (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No photo uploaded.' });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({
      success: true,
      message: 'Photo uploaded successfully.',
      url: fileUrl,
      filename: req.file.filename,
    });
  } catch (err) {
    next(err);
  }
};

router.post('/', authenticate, upload.single('photo'), handleUpload);
router.post('/public', publicUploadLimiter, upload.single('photo'), handleUpload);

module.exports = router;
