const express = require('express');
const asyncHandler = require('../core/asyncHandler');
const { controllers } = require('../container');
const authorize = require('../middlewares/authorize');

const router = express.Router();
const { orderController } = controllers;

router.get('/rider/queue', authorize('admin', 'staff', 'rider'), asyncHandler(orderController.getForRider));
router.put('/:id/rider-confirm', authorize('admin', 'staff', 'rider'), asyncHandler(orderController.riderConfirmDelivery));

router.get('/me', authorize('customer'), asyncHandler(orderController.getMine));
router.get('/customer/:customer_id', authorize('admin', 'staff'), asyncHandler(orderController.getByCustomer));

router.get('/', authorize('admin', 'staff'), asyncHandler(orderController.getAll));
router.get('/:id', authorize('admin', 'staff'), asyncHandler(orderController.getById));
router.post('/', authorize('admin', 'staff', 'customer'), asyncHandler(orderController.create));
router.put('/:id/status', authorize('admin', 'staff'), asyncHandler(orderController.updateStatus));
router.delete('/:id', authorize('admin', 'staff'), asyncHandler(orderController.delete));

module.exports = router;
