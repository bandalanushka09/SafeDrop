const express = require('express');
const router = express.Router();
const articleController = require('../controllers/articleController');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');

router.get('/', optionalAuth, articleController.getArticles);
router.get('/:slug', optionalAuth, articleController.getArticleBySlug);
router.post('/', authenticate, authorize('admin'), articleController.createArticle);
router.patch('/:id', authenticate, authorize('admin'), articleController.updateArticle);
router.delete('/:id', authenticate, authorize('admin'), articleController.deleteArticle);

module.exports = router;

