import { validationResult } from 'express-validator';
import Farm from '../models/Farm.js';
import Crop from '../models/Crop.js';

/* ------------------------------------------------------------------ */
/*  Helper — validate express-validator result                         */
/* ------------------------------------------------------------------ */
const handleValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      message: 'farm.validation_failed',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
    return true; // signals that a response was already sent
  }
  return false;
};

/* ------------------------------------------------------------------ */
/*  Helper — ownership check (farmer must own the farm)               */
/* ------------------------------------------------------------------ */
const isOwnerOrAdmin = (farm, user) => {
  if (user.role === 'admin') return true;
  const ownerId = farm.owner?._id ? farm.owner._id.toString() : farm.owner.toString();
  return ownerId === user.id;
};

/* ================================================================== */
/*  CREATE  POST /api/farms                                            */
/*  Roles: farmer, admin                                              */
/* ================================================================== */
export const createFarm = async (req, res) => {
  if (handleValidation(req, res)) return;

  try {
    const { name, location, sizeAcres, soilType, description } = req.body;

    const farm = await Farm.create({
      name,
      location,
      sizeAcres: sizeAcres !== undefined && sizeAcres !== '' ? parseFloat(sizeAcres) : 0,
      soilType,
      description,
      owner: req.user.id,
    });

    return res.status(201).json({ message: 'farm.created', farm });
  } catch (err) {
    console.error('[createFarm]', err);
    return res.status(500).json({ message: 'server.internal_error' });
  }
};

/* ================================================================== */
/*  READ ALL  GET /api/farms                                           */
/*  - Admin  → all farms (with owner name + email populated)          */
/*  - Farmer → only their own farms                                   */
/* ================================================================== */
export const getFarms = async (req, res) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { owner: req.user.id };

    const farms = await Farm.find(filter)
      .populate('owner', 'name email') // only expose safe fields
      .sort({ createdAt: -1 });

    return res.status(200).json({ count: farms.length, farms });
  } catch (err) {
    console.error('[getFarms]', err);
    return res.status(500).json({ message: 'server.internal_error' });
  }
};

/* ================================================================== */
/*  READ ONE  GET /api/farms/:id                                       */
/*  - Admin  → any farm                                               */
/*  - Farmer → only their own                                         */
/* ================================================================== */
export const getFarmById = async (req, res) => {
  try {
    const farm = await Farm.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('crops'); // uses the virtual defined in Farm schema

    if (!farm) {
      return res.status(404).json({ message: 'farm.not_found' });
    }

    if (!isOwnerOrAdmin(farm, req.user)) {
      return res.status(403).json({ message: 'auth.forbidden' });
    }

    return res.status(200).json({ farm });
  } catch (err) {
    console.error('[getFarmById]', err);
    return res.status(500).json({ message: 'server.internal_error' });
  }
};

/* ================================================================== */
/*  UPDATE  PUT /api/farms/:id                                         */
/*  - Admin  → any farm                                               */
/*  - Farmer → only their own                                         */
/* ================================================================== */
export const updateFarm = async (req, res) => {
  if (handleValidation(req, res)) return;

  try {
    const farm = await Farm.findById(req.params.id);

    if (!farm) {
      return res.status(404).json({ message: 'farm.not_found' });
    }

    if (!isOwnerOrAdmin(farm, req.user)) {
      return res.status(403).json({ message: 'auth.forbidden' });
    }

    // Allow partial updates — only update provided fields
    const allowed = ['name', 'location', 'sizeAcres', 'soilType', 'description', 'isActive'];
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) {
        farm[field] = req.body[field];
      }
    });

    await farm.save();

    return res.status(200).json({ message: 'farm.updated', farm });
  } catch (err) {
    console.error('[updateFarm]', err);
    return res.status(500).json({ message: 'server.internal_error' });
  }
};

/* ================================================================== */
/*  DELETE  DELETE /api/farms/:id                                      */
/*  Cascades: also deletes all crops belonging to this farm            */
/*  - Admin  → any farm                                               */
/*  - Farmer → only their own                                         */
/* ================================================================== */
export const deleteFarm = async (req, res) => {
  try {
    const farm = await Farm.findById(req.params.id);

    if (!farm) {
      return res.status(404).json({ message: 'farm.not_found' });
    }

    if (!isOwnerOrAdmin(farm, req.user)) {
      return res.status(403).json({ message: 'auth.forbidden' });
    }

    // Cascade-delete all crops that belong to this farm
    await Crop.deleteMany({ farm: farm._id });

    await farm.deleteOne();

    return res.status(200).json({ message: 'farm.deleted' });
  } catch (err) {
    console.error('[deleteFarm]', err);
    return res.status(500).json({ message: 'server.internal_error' });
  }
};
