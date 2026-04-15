const express = require('express');
const asyncHandler = require('../core/asyncHandler');
const { controllers } = require('../container');

const router = express.Router();
const { orderController } = controllers;

router.get('/rider/queue', asyncHandler(orderController.getForRider));
router.put('/:id/rider-confirm', asyncHandler(orderController.riderConfirmDelivery));

router.get('/customer/:customer_id', asyncHandler(orderController.getByCustomer));

router.get('/', asyncHandler(orderController.getAll));
router.get('/:id', asyncHandler(orderController.getById));
router.post('/', asyncHandler(orderController.create));
router.put('/:id/status', asyncHandler(orderController.updateStatus));
router.delete('/:id', asyncHandler(orderController.delete));

module.exports = router;
