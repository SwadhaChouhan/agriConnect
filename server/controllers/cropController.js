import { validationResult } from 'express-validator';
import Crop from '../models/Crop.js';
import Farm from '../models/Farm.js';

/* ------------------------------------------------------------------ */
/*  Helper — validate express-validator result                         */
/* ------------------------------------------------------------------ */
const handleValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      message: 'crop.validation_failed',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
    return true;
  }
  return false;
};

/* ------------------------------------------------------------------ */
/*  Helper — verify the requesting user can access the parent farm     */
/*  Returns the farm document, or sends a 403/404 response itself.    */
/* ------------------------------------------------------------------ */
const resolveFarm = async (farmId, user, res) => {
  const farm = await Farm.findById(farmId);

  if (!farm) {
    res.status(404).json({ message: 'farm.not_found' });
    return null;
  }

  const isOwner = (farm.owner?._id ? farm.owner._id.toString() : farm.owner.toString()) === user.id;
  const isAdmin  = user.role === 'admin';

  if (!isOwner && !isAdmin) {
    res.status(403).json({ message: 'auth.forbidden' });
    return null;
  }

  return farm;
};

/* ================================================================== */
/*  CREATE  POST /api/farms/:farmId/crops                             */
/* ================================================================== */
export const createCrop = async (req, res) => {
  if (handleValidation(req, res)) return;

  try {
    const farm = await resolveFarm(req.params.farmId, req.user, res);
    if (!farm) return; // resolveFarm already sent the response

    const {
      name, variety, season, status,
      areaUsedAcres, plantedAt, expectedHarvestDate, notes,
    } = req.body;

    const crop = await Crop.create({
      name,
      farm: farm._id,
      variety,
      season,
      status,
      areaUsedAcres: areaUsedAcres !== undefined && areaUsedAcres !== '' ? parseFloat(areaUsedAcres) : 0,
      plantedAt: plantedAt || null,
      expectedHarvestDate: expectedHarvestDate || null,
      notes,
    });

    return res.status(201).json({ message: 'crop.created', crop });
  } catch (err) {
    console.error('[createCrop]', err);
    return res.status(500).json({ message: 'server.internal_error' });
  }
};

/* ================================================================== */
/*  READ ALL  GET /api/farms/:farmId/crops                            */
/* ================================================================== */
export const getCropsByFarm = async (req, res) => {
  try {
    const farm = await resolveFarm(req.params.farmId, req.user, res);
    if (!farm) return;

    const crops = await Crop.find({ farm: farm._id }).sort({ createdAt: -1 });

    return res.status(200).json({ count: crops.length, crops });
  } catch (err) {
    console.error('[getCropsByFarm]', err);
    return res.status(500).json({ message: 'server.internal_error' });
  }
};

/* ================================================================== */
/*  READ ONE  GET /api/farms/:farmId/crops/:cropId                    */
/* ================================================================== */
export const getCropById = async (req, res) => {
  try {
    const farm = await resolveFarm(req.params.farmId, req.user, res);
    if (!farm) return;

    const crop = await Crop.findOne({
      _id:  req.params.cropId,
      farm: farm._id, // ensures the crop belongs to THIS farm
    });

    if (!crop) {
      return res.status(404).json({ message: 'crop.not_found' });
    }

    return res.status(200).json({ crop });
  } catch (err) {
    console.error('[getCropById]', err);
    return res.status(500).json({ message: 'server.internal_error' });
  }
};

/* ================================================================== */
/*  UPDATE  PUT /api/farms/:farmId/crops/:cropId                      */
/* ================================================================== */
export const updateCrop = async (req, res) => {
  if (handleValidation(req, res)) return;

  try {
    const farm = await resolveFarm(req.params.farmId, req.user, res);
    if (!farm) return;

    const crop = await Crop.findOne({ _id: req.params.cropId, farm: farm._id });

    if (!crop) {
      return res.status(404).json({ message: 'crop.not_found' });
    }

    // Partial update — only apply provided fields
    const allowed = [
      'name', 'variety', 'season', 'status',
      'areaUsedAcres', 'plantedAt', 'expectedHarvestDate',
      'actualHarvestDate', 'yieldKg', 'notes',
    ];
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) {
        crop[field] = req.body[field];
      }
    });

    await crop.save();

    return res.status(200).json({ message: 'crop.updated', crop });
  } catch (err) {
    console.error('[updateCrop]', err);
    return res.status(500).json({ message: 'server.internal_error' });
  }
};

/* ================================================================== */
/*  DELETE  DELETE /api/farms/:farmId/crops/:cropId                   */
/* ================================================================== */
export const deleteCrop = async (req, res) => {
  try {
    const farm = await resolveFarm(req.params.farmId, req.user, res);
    if (!farm) return;

    const crop = await Crop.findOneAndDelete({
      _id:  req.params.cropId,
      farm: farm._id,
    });

    if (!crop) {
      return res.status(404).json({ message: 'crop.not_found' });
    }

    return res.status(200).json({ message: 'crop.deleted' });
  } catch (err) {
    console.error('[deleteCrop]', err);
    return res.status(500).json({ message: 'server.internal_error' });
  }
};
