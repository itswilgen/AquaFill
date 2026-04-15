const BaseController = require('../core/BaseController');

class InventoryController extends BaseController {
  constructor({ inventoryService }) {
    super();
    this.inventoryService = inventoryService;
  }

  getAll = async (req, res) => {
    const items = await this.inventoryService.getAll();
    return this.ok(res, items);
  };

  create = async (req, res) => {
    const id = await this.inventoryService.create(req.body || {});
    return this.created(res, { message: 'Item created', id });
  };

  update = async (req, res) => {
    await this.inventoryService.update(req.params.id, req.body || {});
    return this.message(res, 'Item updated');
  };

  delete = async (req, res) => {
    await this.inventoryService.delete(req.params.id);
    return this.message(res, 'Item deleted');
  };

  getLowStock = async (req, res) => {
    const items = await this.inventoryService.getLowStock();
    return this.ok(res, items);
  };
}

module.exports = InventoryController;
