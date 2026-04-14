const express = require('express');
const router  = express.Router();
const OrderController = require('../controllers/orderController');

// Rider routes
router.get('/rider/queue', OrderController.getForRider);
router.put('/:id/rider-confirm', OrderController.riderConfirmDelivery);

// Customer specific routes
router.get('/customer/:customer_id', OrderController.getByCustomer);

router.get('/',           OrderController.getAll);
router.get('/:id',        OrderController.getById);
router.post('/',          OrderController.create);
router.put('/:id/status', OrderController.updateStatus);
router.delete('/:id',     OrderController.delete);

module.exports = router;
