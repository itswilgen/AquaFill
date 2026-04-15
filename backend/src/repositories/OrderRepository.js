const db = require('../db/connection');
const Order = require('../models/Order');

class OrderRepository {
  async getAll() {
    return Order.getAll();
  }

  async getById(id) {
    return Order.getById(id);
  }

  async create({ customer_id, quantity, delivery_date }) {
    return Order.create(customer_id, quantity, delivery_date);
  }

  async updateStatus(id, status) {
    return Order.updateStatus(id, status);
  }

  async delete(id) {
    return Order.delete(id);
  }

  async getForRiderQueue() {
    const [rows] = await db.query(`
      SELECT
        orders.*,
        customers.name AS customer_name,
        customers.address AS customer_address,
        customers.phone AS customer_phone,
        bills.id AS bill_id,
        bills.amount,
        bills.status AS bill_status,
        bills.paid_at
      FROM orders
      JOIN customers ON orders.customer_id = customers.id
      LEFT JOIN bills ON orders.id = bills.order_id
      WHERE orders.status <> 'cancelled'
      ORDER BY
        CASE
          WHEN orders.status = 'pending' THEN 0
          WHEN orders.status = 'delivered' THEN 1
          ELSE 2
        END,
        orders.created_at DESC
    `);

    return rows;
  }

  async getByCustomerId(customerId) {
    const [rows] = await db.query(`
      SELECT
        orders.*,
        bills.id AS bill_id,
        bills.amount,
        bills.status AS bill_status,
        bills.paid_at
      FROM orders
      LEFT JOIN bills ON orders.id = bills.order_id
      WHERE orders.customer_id = ?
      ORDER BY orders.created_at DESC
    `, [customerId]);

    return rows;
  }

  async getDeliveryContext(orderId) {
    const [rows] = await db.query(`
      SELECT
        orders.id,
        orders.status,
        bills.id AS bill_id,
        bills.status AS bill_status
      FROM orders
      LEFT JOIN bills ON orders.id = bills.order_id
      WHERE orders.id = ?
      LIMIT 1
    `, [orderId]);

    return rows[0] || null;
  }
}

module.exports = OrderRepository;
