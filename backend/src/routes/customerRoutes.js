const express = require('express');
const router  = express.Router();
const CustomerController = require('../controllers/customerController');

// GET    /api/customers         — get all customers
// GET    /api/customers/search  — search customers
// GET    /api/customers/:id     — get one customer
// POST   /api/customers         — create customer
// PUT    /api/customers/:id     — update customer
// DELETE /api/customers/:id     — delete customer

router.get('/search',  CustomerController.search);
router.get('/',        CustomerController.getAll);
router.get('/:id',     CustomerController.getById);
router.post('/',       CustomerController.create);
router.put('/:id',     CustomerController.update);
router.delete('/:id',  CustomerController.delete);

module.exports = router;