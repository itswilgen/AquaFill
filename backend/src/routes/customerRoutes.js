const express = require('express');
const asyncHandler = require('../core/asyncHandler');
const { controllers } = require('../container');
const authorize = require('../middlewares/authorize');

const router = express.Router();
const { customerController } = controllers;

router.get('/me', authorize('customer'), asyncHandler(customerController.getMe));
router.put('/me', authorize('customer'), asyncHandler(customerController.updateMe));

router.get('/search', authorize('admin', 'staff'), asyncHandler(customerController.search));
router.get('/', authorize('admin', 'staff'), asyncHandler(customerController.getAll));
router.get('/:id', authorize('admin', 'staff'), asyncHandler(customerController.getById));
router.post('/', authorize('admin', 'staff'), asyncHandler(customerController.create));
router.put('/:id', authorize('admin', 'staff'), asyncHandler(customerController.update));
router.delete('/:id', authorize('admin', 'staff'), asyncHandler(customerController.delete));

module.exports = router;
