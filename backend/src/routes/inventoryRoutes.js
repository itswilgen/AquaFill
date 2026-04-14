const express = require('express');
const router  = express.Router();
const InventoryController = require('../controllers/inventoryController');

router.get('/lowstock', InventoryController.getLowStock);
router.get('/',         InventoryController.getAll);
router.post('/',        InventoryController.create);
router.put('/:id',      InventoryController.update);
router.delete('/:id',   InventoryController.delete);

module.exports = router;