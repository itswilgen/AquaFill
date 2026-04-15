const express = require('express');
const asyncHandler = require('../core/asyncHandler');
const { controllers } = require('../container');

const router = express.Router();
const { inventoryController } = controllers;

router.get('/lowstock', asyncHandler(inventoryController.getLowStock));
router.get('/', asyncHandler(inventoryController.getAll));
router.post('/', asyncHandler(inventoryController.create));
router.put('/:id', asyncHandler(inventoryController.update));
router.delete('/:id', asyncHandler(inventoryController.delete));

module.exports = router;
