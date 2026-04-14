const express = require('express');
const router  = express.Router();
const BillingController = require('../controllers/billingController');

router.get('/',                      BillingController.getAll);
router.get('/summary',               BillingController.getSummary);
router.put('/:id/pay',               BillingController.markPaid);
router.delete('/:id',                BillingController.delete);

module.exports = router;
