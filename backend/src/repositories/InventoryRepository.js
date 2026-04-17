const Inventory = require('../models/Inventory');

class InventoryRepository {
  async getAll() {
    return Inventory.getAll();
  }

  async getById(id) {
    return Inventory.getById(id);
  }

  async create({ item_name, quantity, unit, reorder_level }) {
    return Inventory.create(item_name, quantity, unit, reorder_level);
  }

  async update(id, { item_name, quantity, unit, reorder_level }) {
    return Inventory.update(id, item_name, quantity, unit, reorder_level);
  }

  async delete(id) {
    return Inventory.delete(id);
  }

  async getLowStock() {
    return Inventory.getLowStock();
  }
}

module.exports = InventoryRepository;
