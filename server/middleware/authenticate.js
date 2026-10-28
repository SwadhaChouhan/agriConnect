import jwt from 'jsonwebtoken';

/**
 * authenticate middleware
 * ─────────────────────────────────────────────────────────────────────
 * Reads the JWT access token from the `Authorization: Bearer <token>`
 * header, verifies it against JWT_ACCESS_SECRET, and attaches the
 * decoded payload ({ id, role }) to req.user.
 *
 * On failure it returns 401 with an i18n-ready message key so the
 * React frontend can translate it via react-i18next.
 */
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'auth.no_token' });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'auth.no_token' });
    }

    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    // payload shape: { id, role, iat, exp }
    req.user = payload;
    next();
  } catch (err) {
    // jwt.verify throws TokenExpiredError or JsonWebTokenError
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'auth.token_expired' });
    }
    return res.status(401).json({ message: 'auth.token_invalid' });
  }
};

export default authenticate;
