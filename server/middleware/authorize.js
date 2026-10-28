/**
 * authorize middleware (role guard)
 * ─────────────────────────────────────────────────────────────────────
 * Returns a route-level middleware that checks whether req.user.role
 * is present in the allowed roles list.
 *
 * Usage:
 *   router.get('/admin/users', authenticate, authorize('admin'), getAllUsers);
 *   router.get('/farm/mine',   authenticate, authorize('farmer', 'admin'), getMyFarm);
 *
 * Must be used AFTER the `authenticate` middleware (req.user must exist).
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      // Should never happen when chained after authenticate, but guard anyway
      return res.status(401).json({ message: 'auth.not_authenticated' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'auth.forbidden' });
    }

    next();
  };
};

export default authorize;
