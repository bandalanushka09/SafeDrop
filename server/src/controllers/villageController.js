const Village = require('../models/Village');
const WaterSource = require('../models/WaterSource');
const { logAudit } = require('../services/auditService');

const getVillages = async (req, res, next) => {
  try {
    const villages = await Village.find({ active: true }).sort({ name: 1 });
    // Also include any distinct villages from water sources to be helpful
    const sourceVillages = await WaterSource.distinct('village');
    const existingNames = new Set(villages.map((v) => v.name));

    const combined = [...villages];
    sourceVillages.forEach((name) => {
      if (name && !existingNames.has(name)) {
        combined.push({ _id: name, name, district: 'Local Area', population: 0, active: true });
      }
    });

    res.json({ success: true, data: combined });
  } catch (err) {
    next(err);
  }
};

const createVillage = async (req, res, next) => {
  try {
    const { name, district, population, primaryContact } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Village name is required' });
    }

    const village = new Village({
      name: name.trim(),
      district: district ? district.trim() : 'Central District',
      population: population ? Number(population) : 0,
      primaryContact: primaryContact ? primaryContact.trim() : '',
    });

    await village.save();

    await logAudit({
      actor: req.user,
      action: 'VILLAGE_CREATED',
      entityType: 'Village',
      entityId: village._id,
      safeMetadata: { name: village.name },
    });

    res.status(201).json({ success: true, message: 'Village added.', data: village });
  } catch (err) {
    next(err);
  }
};

const deleteVillage = async (req, res, next) => {
  try {
    const village = await Village.findById(req.params.id);
    if (!village) {
      return res.status(404).json({ success: false, message: 'Village not found' });
    }
    village.active = false;
    await village.save();

    res.json({ success: true, message: 'Village deactivated.', data: village });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getVillages,
  createVillage,
  deleteVillage,
};

