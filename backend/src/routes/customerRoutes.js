const express = require('express');
const asyncHandler = require('../core/asyncHandler');
const { controllers } = require('../container');

const router = express.Router();
const { customerController } = controllers;

router.get('/search', asyncHandler(customerController.search));
router.get('/', asyncHandler(customerController.getAll));
router.get('/:id', asyncHandler(customerController.getById));
router.post('/', asyncHandler(customerController.create));
router.put('/:id', asyncHandler(customerController.update));
router.delete('/:id', asyncHandler(customerController.delete));

module.exports = router;
