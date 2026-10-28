import { Router } from 'express';
import { body } from 'express-validator';
import {
  register,
  login,
  refresh,
  logout,
  getMe,
} from '../controllers/authController.js';
import authenticate from '../middleware/authenticate.js';

const router = Router();

/* ------------------------------------------------------------------ */
/*  Validation rule sets                                               */
/* ------------------------------------------------------------------ */

/** Validation for POST /register */
const registerValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('validation.name_required')
    .isLength({ min: 2, max: 60 })
    .withMessage('validation.name_length'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('validation.email_required')
    .isEmail()
    .withMessage('validation.email_invalid')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('validation.password_required')
    .isLength({ min: 8 })
    .withMessage('validation.password_min_length')
    .matches(/[A-Z]/)
    .withMessage('validation.password_needs_uppercase')
    .matches(/[0-9]/)
    .withMessage('validation.password_needs_number'),
];

/** Validation for POST /login */
const loginValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('validation.email_required')
    .isEmail()
    .withMessage('validation.email_invalid')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('validation.password_required'),
];

/* ------------------------------------------------------------------ */
/*  Routes                                                             */
/* ------------------------------------------------------------------ */

/**
 * POST /api/auth/register
 * Farmer self-registration (no admin registration via this endpoint)
 */
router.post('/register', registerValidation, register);

/**
 * POST /api/auth/login
 * Unified login for both farmers and admins
 */
router.post('/login', loginValidation, login);

/**
 * POST /api/auth/refresh
 * Reads the HttpOnly refresh cookie and issues a new access token
 */
router.post('/refresh', refresh);

/**
 * POST /api/auth/logout
 * Clears the DB refresh token and the HttpOnly cookie
 */
router.post('/logout', logout);

/**
 * GET /api/auth/me
 * Returns the currently authenticated user's profile
 * Protected — requires a valid Bearer access token
 */
router.get('/me', authenticate, getMe);

export default router;
