const AppError = require('../core/AppError');

class InventoryService {
  constructor({ inventoryRepository }) {
    this.inventoryRepository = inventoryRepository;
  }

  sanitizeName(value) {
    return String(value || '').trim().slice(0, 120);
  }

  sanitizeUnit(value) {
    return String(value || '').trim().slice(0, 30);
  }

  parsePositiveNumber(value, label) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
      throw new AppError(`${label} must be zero or greater`, 400, 'VALIDATION_ERROR');
    }
    return parsed;
  }

  parsePositiveInteger(value, label) {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isInteger(parsed) || parsed < 0) {
      throw new AppError(`${label} must be zero or greater`, 400, 'VALIDATION_ERROR');
    }
    return parsed;
  }

  parseEntityId(value, label = 'id') {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      throw new AppError(`Invalid ${label}`, 400, 'VALIDATION_ERROR');
    }
    return parsed;
  }

  async getAll() {
    return this.inventoryRepository.getAll();
  }

  async create({ item_name, quantity, unit, reorder_level }) {
    const normalizedName = this.sanitizeName(item_name);
    if (!normalizedName) {
      throw new AppError('Item name is required', 400, 'VALIDATION_ERROR');
    }

    const normalizedUnit = this.sanitizeUnit(unit);
    if (!normalizedUnit) {
      throw new AppError('Unit is required', 400, 'VALIDATION_ERROR');
    }

    const safeQuantity = this.parsePositiveNumber(quantity, 'Quantity');
    const safeReorderLevel = this.parsePositiveInteger(reorder_level, 'Reorder level');

    return this.inventoryRepository.create({
      item_name: normalizedName,
      quantity: safeQuantity,
      unit: normalizedUnit,
      reorder_level: safeReorderLevel,
    });
  }

  async update(id, { item_name, quantity, unit, reorder_level }) {
    const itemId = this.parseEntityId(id, 'item id');
    const normalizedName = this.sanitizeName(item_name);
    if (!normalizedName) {
      throw new AppError('Item name is required', 400, 'VALIDATION_ERROR');
    }

    const normalizedUnit = this.sanitizeUnit(unit);
    if (!normalizedUnit) {
      throw new AppError('Unit is required', 400, 'VALIDATION_ERROR');
    }

    const safeQuantity = this.parsePositiveNumber(quantity, 'Quantity');
    const safeReorderLevel = this.parsePositiveInteger(reorder_level, 'Reorder level');

    return this.inventoryRepository.update(itemId, {
      item_name: normalizedName,
      quantity: safeQuantity,
      unit: normalizedUnit,
      reorder_level: safeReorderLevel,
    });
  }

  async delete(id) {
    const itemId = this.parseEntityId(id, 'item id');
    return this.inventoryRepository.delete(itemId);
  }

  async getLowStock() {
    return this.inventoryRepository.getLowStock();
  }
}

module.exports = InventoryService;
