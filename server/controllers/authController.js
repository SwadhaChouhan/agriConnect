import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import User from '../models/User.js';

/* ------------------------------------------------------------------ */
/*  Helper — build cookie options (CRITICAL CORRECTION applied)        */
/* ------------------------------------------------------------------ */
const refreshCookieOptions = {
  httpOnly: true,                                        // not accessible via JS
  secure: process.env.NODE_ENV === 'production',         // HTTPS only in prod
  sameSite: 'strict',                                    // CSRF protection
  maxAge: 7 * 24 * 60 * 60 * 1000,                     // 7 days in ms
  path: '/api/auth',                                     // scope cookie to auth routes
};

/* ------------------------------------------------------------------ */
/*  Helper — token factories                                           */
/* ------------------------------------------------------------------ */
const signAccessToken = (payload) =>
  jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
  });

const signRefreshToken = (payload) =>
  jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d',
  });

/* ------------------------------------------------------------------ */
/*  Helper — express-validator result check                            */
/* ------------------------------------------------------------------ */
const handleValidationErrors = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'auth.validation_failed',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  return null; // no errors
};

/* ================================================================== */
/*  1. POST /api/auth/register — Farmer self-registration             */
/* ================================================================== */
export const register = async (req, res) => {
  // Run validation
  const validationError = handleValidationErrors(req, res);
  if (validationError !== null) return;

  try {
    const { name, email, password } = req.body;

    // Check for duplicate email
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ message: 'auth.email_taken' });
    }

    // Create farmer — password hashing is handled by the pre-save hook
    const user = new User({ name, email, password, role: 'farmer' });
    await user.save();

    return res.status(201).json({ message: 'auth.registered_successfully' });
  } catch (err) {
    console.error('[register]', err);
    return res.status(500).json({ message: 'server.internal_error' });
  }
};

/* ================================================================== */
/*  2. POST /api/auth/login — Unified login (farmer + admin)          */
/* ================================================================== */
export const login = async (req, res) => {
  const validationError = handleValidationErrors(req, res);
  if (validationError !== null) return;

  try {
    const { email, password } = req.body;

    // Find user (include password for comparison)
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password +refreshToken');

    // Use a generic message to avoid user-enumeration attacks
    if (!user) {
      return res.status(401).json({ message: 'auth.invalid_credentials' });
    }

    // Compare plain-text password with bcrypt hash
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'auth.invalid_credentials' });
    }

    // Generate tokens
    const tokenPayload = { id: user._id.toString(), role: user.role };
    const accessToken  = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken({ id: user._id.toString() });

    // Persist refresh token in DB
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    // Set HttpOnly cookie (CRITICAL CORRECTION applied)
    res.cookie('refreshToken', refreshToken, refreshCookieOptions);

    return res.status(200).json({
      accessToken,
      user: {
        id:   user._id,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('[login]', err);
    return res.status(500).json({ message: 'server.internal_error' });
  }
};

/* ================================================================== */
/*  3. POST /api/auth/refresh — Issue new access token                */
/* ================================================================== */
export const refresh = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;

    if (!token) {
      return res.status(401).json({ message: 'auth.no_refresh_token' });
    }

    // Verify JWT signature
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch {
      return res.status(401).json({ message: 'auth.refresh_token_invalid' });
    }

    // Look up user and compare stored token (prevents token reuse after logout)
    const user = await User.findById(payload.id).select('+refreshToken');
    if (!user || user.refreshToken !== token) {
      return res.status(401).json({ message: 'auth.refresh_token_reuse' });
    }

    // Issue a fresh access token
    const accessToken = signAccessToken({ id: user._id.toString(), role: user.role });

    return res.status(200).json({ accessToken });
  } catch (err) {
    console.error('[refresh]', err);
    return res.status(500).json({ message: 'server.internal_error' });
  }
};

/* ================================================================== */
/*  4. POST /api/auth/logout — Clear tokens                           */
/* ================================================================== */
export const logout = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;

    if (token) {
      // Invalidate the token in DB (if a user record matches)
      const payload = (() => {
        try {
          return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
        } catch {
          return null;
        }
      })();

      if (payload?.id) {
        await User.findByIdAndUpdate(payload.id, { refreshToken: null });
      }
    }

    // Clear the HttpOnly cookie (CRITICAL CORRECTION applied)
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/auth',
    });

    return res.status(200).json({ message: 'auth.logged_out' });
  } catch (err) {
    console.error('[logout]', err);
    return res.status(500).json({ message: 'server.internal_error' });
  }
};

/* ================================================================== */
/*  5. GET /api/auth/me — Get current user profile (protected)        */
/* ================================================================== */
export const getMe = async (req, res) => {
  try {
    // req.user is populated by the authenticate middleware
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'user.not_found' });
    }

    // toJSON transformer strips password, refreshToken, and __v
    return res.status(200).json({ user });
  } catch (err) {
    console.error('[getMe]', err);
    return res.status(500).json({ message: 'server.internal_error' });
  }
};
