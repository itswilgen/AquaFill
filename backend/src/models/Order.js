const db = require('../db/connection');

class Order {
  constructor(id, customer_id, quantity, status, delivery_date, created_at) {
    this.id            = id;
    this.customer_id   = customer_id;
    this.quantity      = quantity;
    this.status        = status;
    this.delivery_date = delivery_date;
    this.created_at    = created_at;
  }

  static async getAll() {
    // JOIN with customers so we get the customer name too
    const [rows] = await db.query(`
      SELECT orders.*, customers.name AS customer_name
      FROM orders
      JOIN customers ON orders.customer_id = customers.id
      ORDER BY orders.created_at DESC
    `);
    return rows;
  }

  static async getById(id) {
    const [rows] = await db.query(`
      SELECT orders.*, customers.name AS customer_name
      FROM orders
      JOIN customers ON orders.customer_id = customers.id
      WHERE orders.id = ?
    `, [id]);
    return rows[0];
  }

  static async create(customer_id, quantity, delivery_date) {
    const [result] = await db.query(
      'INSERT INTO orders (customer_id, quantity, delivery_date) VALUES (?, ?, ?)',
      [customer_id, quantity, delivery_date]
    );
    return result.insertId;
  }

  static async updateStatus(id, status) {
    await db.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
  }

  static async delete(id) {
    await db.query('DELETE FROM orders WHERE id = ?', [id]);
  }
}

module.exports = Order;