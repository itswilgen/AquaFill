const AppError = require('../core/AppError');

function authorize(...allowedRoles) {
  const normalized = allowedRoles.map((role) => String(role || '').toLowerCase());

  return function roleGuard(req, res, next) {
    if (!req.user) {
      return next(new AppError('Authentication is required', 401, 'AUTH_REQUIRED'));
    }

    if (normalized.length === 0) {
      return next();
    }

    const userRole = String(req.user.role || '').toLowerCase();
    if (!normalized.includes(userRole)) {
      return next(new AppError('You do not have permission to perform this action', 403, 'AUTH_FORBIDDEN'));
    }

    return next();
  };
}

module.exports = authorize;
