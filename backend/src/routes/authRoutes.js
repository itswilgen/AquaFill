const express = require('express');
const asyncHandler = require('../core/asyncHandler');
const { controllers } = require('../container');
const { createRateLimiter } = require('../middlewares/rateLimit');

const router = express.Router();
const { authController } = controllers;

const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => {
    const username = String(req.body?.username || req.body?.email || '').trim().toLowerCase();
    return `${req.ip || 'unknown'}:${username || 'anonymous'}`;
  },
  message: 'Too many login attempts. Please wait before trying again.',
  code: 'AUTH_LOGIN_RATE_LIMITED',
});

const registerLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 6,
  keyGenerator: (req) => `${req.ip || 'unknown'}:register`,
  message: 'Too many signup attempts. Please try again later.',
  code: 'AUTH_REGISTER_RATE_LIMITED',
});

const googleLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 15,
  keyGenerator: (req) => `${req.ip || 'unknown'}:google`,
  message: 'Too many Google login attempts. Please wait and retry.',
  code: 'AUTH_GOOGLE_RATE_LIMITED',
});

router.post('/login', loginLimiter, asyncHandler(authController.login));
router.post('/register', registerLimiter, asyncHandler(authController.register));
router.post('/google', googleLimiter, asyncHandler(authController.googleLogin));

module.exports = router;
