const AppError = require('../core/AppError');

class InventoryService {
  constructor({ inventoryRepository }) {
    this.inventoryRepository = inventoryRepository;
  }

  async getAll() {
    return this.inventoryRepository.getAll();
  }

  async create({ item_name, quantity, unit, reorder_level }) {
    if (!item_name) {
      throw new AppError('Item name is required', 400, 'VALIDATION_ERROR');
    }

    return this.inventoryRepository.create({ item_name, quantity, unit, reorder_level });
  }

  async update(id, { item_name, quantity, unit, reorder_level }) {
    return this.inventoryRepository.update(id, { item_name, quantity, unit, reorder_level });
  }

  async delete(id) {
    return this.inventoryRepository.delete(id);
  }

  async getLowStock() {
    return this.inventoryRepository.getLowStock();
  }
}

module.exports = InventoryService;
