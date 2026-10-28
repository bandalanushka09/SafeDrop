const DiseaseArticle = require('../models/DiseaseArticle');
const { logAudit } = require('../services/auditService');

const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
};

const getArticles = async (req, res, next) => {
  try {
    const { category, language = 'en', status = 'published', search } = req.query;
    const query = {};

    const isStaff = req.user && ['health_worker', 'admin'].includes(req.user.role);
    if (!isStaff || status === 'published') {
      query.status = 'published';
    } else if (status) {
      query.status = status;
    }

    if (category) query.category = category;
    if (language) query.language = language;

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { summary: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
      ];
    }

    const articles = await DiseaseArticle.find(query)
      .populate('reviewedBy', 'name role')
      .sort({ publishedAt: -1, createdAt: -1 });

    res.json({
      success: true,
      data: articles,
    });
  } catch (err) {
    next(err);
  }
};

const getArticleBySlug = async (req, res, next) => {
  try {
    const article = await DiseaseArticle.findOne({ slug: req.params.slug })
      .populate('reviewedBy', 'name role');

    if (!article) {
      return res.status(404).json({ success: false, message: 'Educational article not found' });
    }

    res.json({ success: true, data: article });
  } catch (err) {
    next(err);
  }
};

const createArticle = async (req, res, next) => {
  try {
    const {
      title,
      summary,
      content,
      category,
      language,
      transmissionInfo,
      preventionGuidance,
      warningSigns,
      references,
      status,
    } = req.body;

    if (!title || !summary || !content) {
      return res.status(400).json({
        success: false,
        message: 'Title, summary, and content are required.',
      });
    }

    let slug = slugify(title);
    const existing = await DiseaseArticle.findOne({ slug });
    if (existing) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    const article = new DiseaseArticle({
      title: title.trim(),
      slug,
      summary: summary.trim(),
      content: content.trim(),
      category: category || 'general',
      language: language || 'en',
      transmissionInfo: transmissionInfo ? transmissionInfo.trim() : '',
      preventionGuidance: preventionGuidance ? preventionGuidance.trim() : '',
      warningSigns: warningSigns ? warningSigns.trim() : '',
      references: Array.isArray(references) ? references : [],
      status: status || 'published',
      reviewedBy: req.user._id,
      reviewedAt: new Date(),
      publishedAt: status === 'published' ? new Date() : undefined,
    });

    await article.save();

    await logAudit({
      actor: req.user,
      action: 'ARTICLE_CREATED',
      entityType: 'DiseaseArticle',
      entityId: article._id,
      safeMetadata: { title: article.title, category: article.category },
    });

    res.status(201).json({
      success: true,
      message: 'Educational article created successfully.',
      data: article,
    });
  } catch (err) {
    next(err);
  }
};

const updateArticle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const article = await DiseaseArticle.findById(id);
    if (!article) {
      return res.status(404).json({ success: false, message: 'Article not found' });
    }

    if (updates.title) article.title = updates.title.trim();
    if (updates.summary) article.summary = updates.summary.trim();
    if (updates.content) article.content = updates.content.trim();
    if (updates.category) article.category = updates.category;
    if (updates.language) article.language = updates.language;
    if (updates.transmissionInfo !== undefined) article.transmissionInfo = updates.transmissionInfo.trim();
    if (updates.preventionGuidance !== undefined) article.preventionGuidance = updates.preventionGuidance.trim();
    if (updates.warningSigns !== undefined) article.warningSigns = updates.warningSigns.trim();
    if (Array.isArray(updates.references)) article.references = updates.references;
    if (updates.status) {
      article.status = updates.status;
      if (updates.status === 'published' && !article.publishedAt) {
        article.publishedAt = new Date();
      }
    }
    article.reviewedBy = req.user._id;
    article.reviewedAt = new Date();

    await article.save();

    await logAudit({
      actor: req.user,
      action: 'ARTICLE_UPDATED',
      entityType: 'DiseaseArticle',
      entityId: article._id,
      safeMetadata: { updates: Object.keys(updates) },
    });

    res.json({
      success: true,
      message: 'Article updated successfully.',
      data: article,
    });
  } catch (err) {
    next(err);
  }
};

const deleteArticle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const article = await DiseaseArticle.findById(id);
    if (!article) {
      return res.status(404).json({ success: false, message: 'Article not found' });
    }

    article.status = 'archived';
    await article.save();

    await logAudit({
      actor: req.user,
      action: 'ARTICLE_ARCHIVED',
      entityType: 'DiseaseArticle',
      entityId: article._id,
    });

    res.json({
      success: true,
      message: 'Article archived successfully.',
      data: article,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getArticles,
  getArticleBySlug,
  createArticle,
  updateArticle,
  deleteArticle,
};

