const express = require('express');
const asyncHandler = require('../core/asyncHandler');
const { controllers } = require('../container');
const authorize = require('../middlewares/authorize');

const router = express.Router();
const { inventoryController } = controllers;

router.get('/lowstock', authorize('admin', 'staff'), asyncHandler(inventoryController.getLowStock));
router.get('/', authorize('admin', 'staff', 'rider', 'customer'), asyncHandler(inventoryController.getAll));
router.post('/', authorize('admin', 'staff'), asyncHandler(inventoryController.create));
router.put('/:id', authorize('admin', 'staff'), asyncHandler(inventoryController.update));
router.delete('/:id', authorize('admin', 'staff'), asyncHandler(inventoryController.delete));

module.exports = router;
