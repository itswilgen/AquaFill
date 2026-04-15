const express = require('express');
const asyncHandler = require('../core/asyncHandler');
const { controllers } = require('../container');

const router = express.Router();
const { authController } = controllers;

router.post('/login', asyncHandler(authController.login));
router.post('/register', asyncHandler(authController.register));
router.post('/google', asyncHandler(authController.googleLogin));

module.exports = router;
