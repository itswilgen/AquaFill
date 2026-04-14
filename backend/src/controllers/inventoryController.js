const Inventory = require('../models/Inventory');

class InventoryController {
  static async getAll(req, res) {
    try {
      const items = await Inventory.getAll();
      res.json({ success: true, data: items });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async create(req, res) {
    try {
      const { item_name, quantity, unit, reorder_level } = req.body;
      if (!item_name) return res.status(400).json({ success: false, message: 'Item name is required' });
      const id = await Inventory.create(item_name, quantity, unit, reorder_level);
      res.status(201).json({ success: true, message: 'Item created', id });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async update(req, res) {
    try {
      const { item_name, quantity, unit, reorder_level } = req.body;
      await Inventory.update(req.params.id, item_name, quantity, unit, reorder_level);
      res.json({ success: true, message: 'Item updated' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async delete(req, res) {
    try {
      await Inventory.delete(req.params.id);
      res.json({ success: true, message: 'Item deleted' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async getLowStock(req, res) {
    try {
      const items = await Inventory.getLowStock();
      res.json({ success: true, data: items });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = InventoryController;