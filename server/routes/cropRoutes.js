import { Router } from 'express';
import { body, param } from 'express-validator';
import authenticate from '../middleware/authenticate.js';
import authorize    from '../middleware/authorize.js';
import {
  createCrop,
  getCropsByFarm,
  getCropById,
  updateCrop,
  deleteCrop,
} from '../controllers/cropController.js';

/**
 * Crop routes are nested under farms:
 *   /api/farms/:farmId/crops
 *
 * The router is mounted with { mergeParams: true } so that
 * req.params.farmId is accessible inside the controller.
 */
const router = Router({ mergeParams: true });

// All crop routes require a valid access token
router.use(authenticate);

/* ------------------------------------------------------------------ */
/*  Validation rule sets                                               */
/* ------------------------------------------------------------------ */

const validSeasons  = ['kharif', 'rabi', 'zaid', 'year-round', ''];
const validStatuses = ['planned', 'planted', 'growing', 'ready', 'harvested', 'failed'];

const cropBodyValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('validation.crop_name_required')
    .isLength({ max: 100 }).withMessage('validation.crop_name_too_long'),

  body('season')
    .optional()
    .isIn(validSeasons).withMessage('validation.crop_season_invalid'),

  body('status')
    .optional()
    .isIn(validStatuses).withMessage('validation.crop_status_invalid'),

  body('areaUsedAcres')
    .optional()
    .isFloat({ min: 0 }).withMessage('validation.crop_area_negative'),

  body('plantedAt')
    .optional()
    .isISO8601().withMessage('validation.crop_planted_at_invalid'),

  body('expectedHarvestDate')
    .optional()
    .isISO8601().withMessage('validation.crop_harvest_date_invalid'),

  body('actualHarvestDate')
    .optional()
    .isISO8601().withMessage('validation.crop_actual_harvest_invalid'),

  body('yieldKg')
    .optional()
    .isFloat({ min: 0 }).withMessage('validation.crop_yield_negative'),

  body('notes')
    .optional()
    .isLength({ max: 1000 }).withMessage('validation.crop_notes_too_long'),
];

const mongoIdParam = (paramName) =>
  param(paramName)
    .isMongoId()
    .withMessage(`validation.invalid_id_${paramName}`);

/* ------------------------------------------------------------------ */
/*  Routes                                                             */
/* ------------------------------------------------------------------ */

/**
 * POST /api/farms/:farmId/crops
 * Add a crop to a farm. Farmer must own the farm.
 */
router.post(
  '/',
  authorize('farmer', 'admin'),
  mongoIdParam('farmId'),
  cropBodyValidation,
  createCrop
);

/**
 * GET /api/farms/:farmId/crops
 * List all crops for a farm.
 */
router.get(
  '/',
  authorize('farmer', 'admin'),
  mongoIdParam('farmId'),
  getCropsByFarm
);

/**
 * GET /api/farms/:farmId/crops/:cropId
 * Get a single crop by ID.
 */
router.get(
  '/:cropId',
  authorize('farmer', 'admin'),
  mongoIdParam('farmId'),
  mongoIdParam('cropId'),
  getCropById
);

/**
 * PUT /api/farms/:farmId/crops/:cropId
 * Partial update. Farmer must own the parent farm.
 */
router.put(
  '/:cropId',
  authorize('farmer', 'admin'),
  mongoIdParam('farmId'),
  mongoIdParam('cropId'),
  cropBodyValidation.map((rule) => rule.optional()),
  updateCrop
);

/**
 * DELETE /api/farms/:farmId/crops/:cropId
 * Delete a single crop.
 */
router.delete(
  '/:cropId',
  authorize('farmer', 'admin'),
  mongoIdParam('farmId'),
  mongoIdParam('cropId'),
  deleteCrop
);

export default router;
