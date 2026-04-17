const jwt = require('jsonwebtoken');
const AppError = require('../core/AppError');

function createAuthenticate({ userRepository, jwtSecret }) {
  if (!jwtSecret) {
    throw new Error('JWT_SECRET is required to initialize authentication middleware.');
  }

  return async function authenticate(req, res, next) {
    try {
      const header = String(req.headers.authorization || '');
      if (!header.startsWith('Bearer ')) {
        throw new AppError('Authentication token is required', 401, 'AUTH_REQUIRED');
      }

      const token = header.slice('Bearer '.length).trim();
      if (!token) {
        throw new AppError('Authentication token is required', 401, 'AUTH_REQUIRED');
      }

      let payload;
      try {
        payload = jwt.verify(token, jwtSecret, { issuer: 'aquafill-api' });
      } catch {
        throw new AppError('Invalid or expired authentication token', 401, 'AUTH_INVALID_TOKEN');
      }

      const userId = Number.parseInt(payload?.id, 10);
      if (!Number.isInteger(userId) || userId <= 0) {
        throw new AppError('Invalid authentication token', 401, 'AUTH_INVALID_TOKEN');
      }

      const user = await userRepository.findById(userId);
      if (!user) {
        throw new AppError('User account no longer exists', 401, 'AUTH_USER_NOT_FOUND');
      }

      req.user = {
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name || user.username,
        email: user.email || null,
        customer_id: user.customer_id || null,
      };

      return next();
    } catch (err) {
      return next(err);
    }
  };
}

module.exports = {
  createAuthenticate,
};
