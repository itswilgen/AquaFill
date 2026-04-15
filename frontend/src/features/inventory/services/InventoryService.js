import { toAppError } from '../../../core/errors/AppError';

export default class InventoryService {
  constructor({ inventoryRepository }) {
    this.inventoryRepository = inventoryRepository;
  }

  async getInventory() {
    try {
      return await this.inventoryRepository.getAll();
    } catch (err) {
      throw toAppError(err, 'Failed to load inventory');
    }
  }

  async getLowStock() {
    try {
      return await this.inventoryRepository.getLowStock();
    } catch (err) {
      throw toAppError(err, 'Failed to load low stock items');
    }
  }

  async createItem(payload) {
    try {
      return await this.inventoryRepository.create(payload);
    } catch (err) {
      throw toAppError(err, 'Failed to create item');
    }
  }

  async updateItem(id, payload) {
    try {
      return await this.inventoryRepository.update(id, payload);
    } catch (err) {
      throw toAppError(err, 'Failed to update item');
    }
  }

  async deleteItem(id) {
    try {
      return await this.inventoryRepository.delete(id);
    } catch (err) {
      throw toAppError(err, 'Failed to delete item');
    }
  }
}
