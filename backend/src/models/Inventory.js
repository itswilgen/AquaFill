const db = require('../db/connection');

class Inventory {
  constructor(id, item_name, quantity, unit, reorder_level, updated_at) {
    this.id            = id;
    this.item_name     = item_name;
    this.quantity      = quantity;
    this.unit          = unit;
    this.reorder_level = reorder_level;
    this.updated_at    = updated_at;
  }

  static async getAll() {
    const [rows] = await db.query('SELECT * FROM inventory ORDER BY item_name');
    return rows;
  }

  static async getById(id) {
    const [rows] = await db.query('SELECT * FROM inventory WHERE id = ?', [id]);
    return rows[0];
  }

  static async create(item_name, quantity, unit, reorder_level) {
    const [result] = await db.query(
      'INSERT INTO inventory (item_name, quantity, unit, reorder_level) VALUES (?, ?, ?, ?)',
      [item_name, quantity, unit, reorder_level]
    );
    return result.insertId;
  }

  static async update(id, item_name, quantity, unit, reorder_level) {
    await db.query(
      'UPDATE inventory SET item_name = ?, quantity = ?, unit = ?, reorder_level = ? WHERE id = ?',
      [item_name, quantity, unit, reorder_level, id]
    );
  }

  static async delete(id) {
    await db.query('DELETE FROM inventory WHERE id = ?', [id]);
  }

  // Returns items where quantity is below reorder_level — for dashboard alerts
  static async getLowStock() {
    const [rows] = await db.query(
      'SELECT * FROM inventory WHERE quantity <= reorder_level'
    );
    return rows;
  }
}

module.exports = Inventory;