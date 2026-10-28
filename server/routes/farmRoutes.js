import { Router } from 'express';
import { body, param } from 'express-validator';
import authenticate from '../middleware/authenticate.js';
import authorize    from '../middleware/authorize.js';
import {
  createFarm,
  getFarms,
  getFarmById,
  updateFarm,
  deleteFarm,
} from '../controllers/farmController.js';

const router = Router();

// All farm routes require a valid access token
router.use(authenticate);

/* ------------------------------------------------------------------ */
/*  Validation rule sets                                               */
/* ------------------------------------------------------------------ */

const farmBodyValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('validation.farm_name_required')
    .isLength({ max: 100 }).withMessage('validation.farm_name_too_long'),

  body('sizeAcres')
    .optional()
    .isFloat({ min: 0 }).withMessage('validation.farm_size_negative'),

  body('soilType')
    .optional()
    .trim()
    .toLowerCase()
    .isIn(['alluvial', 'black', 'red', 'laterite', 'arid', 'forest', 'loamy', 'clayey', 'sandy', 'other', ''])
    .withMessage('validation.farm_soil_type_invalid'),

  body('description')
    .optional()
    .isLength({ max: 500 }).withMessage('validation.farm_description_too_long'),

  body('location.pincode')
    .optional()
    .matches(/^\d{0,6}$/).withMessage('validation.farm_pincode_invalid'),
];

const mongoIdParam = (paramName) =>
  param(paramName)
    .isMongoId()
    .withMessage(`validation.invalid_id_${paramName}`);

/* ------------------------------------------------------------------ */
/*  Routes                                                             */
/* ------------------------------------------------------------------ */

/**
 * POST /api/farms
 * Farmer creates their own farm. Admin can also create farms.
 */
router.post(
  '/',
  authorize('farmer', 'admin'),
  farmBodyValidation,
  createFarm
);

/**
 * GET /api/farms
 * Farmer → their farms only.
 * Admin  → all farms.
 */
router.get(
  '/',
  authorize('farmer', 'admin'),
  getFarms
);

/**
 * GET /api/farms/:id
 * Returns a single farm with populated crops.
 * Ownership enforced inside the controller.
 */
router.get(
  '/:id',
  authorize('farmer', 'admin'),
  mongoIdParam('id'),
  getFarmById
);

/**
 * PUT /api/farms/:id
 * Partial update. Farmer can only edit their own farm.
 */
router.put(
  '/:id',
  authorize('farmer', 'admin'),
  mongoIdParam('id'),
  farmBodyValidation.map((rule) => rule.optional()), // all fields optional for updates
  updateFarm
);

/**
 * DELETE /api/farms/:id
 * Cascades to all crops. Farmer can only delete their own farm.
 */
router.delete(
  '/:id',
  authorize('farmer', 'admin'),
  mongoIdParam('id'),
  deleteFarm
);

export default router;
