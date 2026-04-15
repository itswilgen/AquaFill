const express = require('express');
const asyncHandler = require('../core/asyncHandler');
const { controllers } = require('../container');

const router = express.Router();
const { billingController } = controllers;

router.get('/', asyncHandler(billingController.getAll));
router.get('/summary', asyncHandler(billingController.getSummary));
router.put('/:id/pay', asyncHandler(billingController.markPaid));
router.delete('/:id', asyncHandler(billingController.delete));

module.exports = router;
