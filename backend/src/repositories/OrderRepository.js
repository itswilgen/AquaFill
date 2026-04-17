const db = require('../db/connection');
const Order = require('../models/Order');

class OrderRepository {
  async ensureItemColumn() {
    const [columns] = await db.query(`
      SELECT 1
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'orders'
        AND COLUMN_NAME = 'item_id'
      LIMIT 1
    `);

    if (columns.length === 0) {
      await db.query('ALTER TABLE orders ADD COLUMN item_id INT NULL AFTER customer_id');
    }

    const [indexes] = await db.query(`
      SELECT 1
      FROM INFORMATION_SCHEMA.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'orders'
        AND INDEX_NAME = 'idx_orders_item_id'
      LIMIT 1
    `);

    if (indexes.length === 0) {
      await db.query('ALTER TABLE orders ADD INDEX idx_orders_item_id (item_id)');
    }

    const [constraints] = await db.query(`
      SELECT 1
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'orders'
        AND COLUMN_NAME = 'item_id'
        AND REFERENCED_TABLE_NAME = 'inventory'
      LIMIT 1
    `);

    if (constraints.length === 0) {
      try {
        await db.query(`
          ALTER TABLE orders
          ADD CONSTRAINT fk_orders_item
          FOREIGN KEY (item_id) REFERENCES inventory(id)
          ON DELETE SET NULL
          ON UPDATE CASCADE
        `);
      } catch {
        // Keep startup resilient in environments where the FK already exists under a different name.
      }
    }
  }

  async getAll() {
    return Order.getAll();
  }

  async getById(id) {
    return Order.getById(id);
  }

  async create({ customer_id, item_id, quantity, delivery_date }) {
    return Order.create(customer_id, item_id, quantity, delivery_date);
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
        inventory.item_name AS item_name,
        inventory.unit AS item_unit,
        bills.id AS bill_id,
        bills.amount,
        bills.status AS bill_status,
        bills.paid_at
      FROM orders
      JOIN customers ON orders.customer_id = customers.id
      LEFT JOIN inventory ON orders.item_id = inventory.id
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
        inventory.item_name AS item_name,
        inventory.unit AS item_unit,
        bills.id AS bill_id,
        bills.amount,
        bills.status AS bill_status,
        bills.paid_at
      FROM orders
      LEFT JOIN inventory ON orders.item_id = inventory.id
      LEFT JOIN bills ON orders.id = bills.order_id
      WHERE orders.customer_id = ?
      ORDER BY orders.created_at DESC
    `, [customerId]);

    return rows;
  }

  async getByUserId(userId) {
    const [rows] = await db.query(`
      SELECT
        orders.*,
        inventory.item_name AS item_name,
        inventory.unit AS item_unit,
        bills.id AS bill_id,
        bills.amount,
        bills.status AS bill_status,
        bills.paid_at
      FROM orders
      JOIN users ON users.customer_id = orders.customer_id
      LEFT JOIN inventory ON orders.item_id = inventory.id
      LEFT JOIN bills ON orders.id = bills.order_id
      WHERE users.id = ?
      ORDER BY orders.created_at DESC
    `, [userId]);

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

  async getOrderAccessContext(orderId) {
    const [rows] = await db.query(`
      SELECT
        orders.id,
        orders.customer_id,
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
