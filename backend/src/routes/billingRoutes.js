const express = require('express');
const asyncHandler = require('../core/asyncHandler');
const { controllers } = require('../container');
const uploadPaymentProof = require('../middlewares/uploadPaymentProof');
const authorize = require('../middlewares/authorize');

const router = express.Router();
const { billingController } = controllers;

router.get('/me', authorize('customer'), asyncHandler(billingController.getMine));
router.get('/', authorize('admin', 'staff'), asyncHandler(billingController.getAll));
router.get('/summary', authorize('admin', 'staff'), asyncHandler(billingController.getSummary));
router.put('/:id/pay', authorize('admin', 'staff', 'customer'), uploadPaymentProof, asyncHandler(billingController.markPaid));
router.delete('/:id', authorize('admin', 'staff'), asyncHandler(billingController.delete));

module.exports = router;
