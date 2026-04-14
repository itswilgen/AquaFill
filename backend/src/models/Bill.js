const db = require('../db/connection');

class Bill {
  constructor(id, order_id, amount, status, paid_at, created_at) {
    this.id         = id;
    this.order_id   = order_id;
    this.amount     = amount;
    this.status     = status;
    this.paid_at    = paid_at;
    this.created_at = created_at;
  }

  static async getAll() {
    const [rows] = await db.query(`
      SELECT
        bills.*,
        orders.quantity,
        customers.name AS customer_name,
        payment_proofs.payment_method,
        payment_proofs.reference_no,
        payment_proofs.payer_name,
        payment_proofs.proof_url
      FROM bills
      JOIN orders ON bills.order_id = orders.id
      JOIN customers ON orders.customer_id = customers.id
      LEFT JOIN payment_proofs ON bills.id = payment_proofs.bill_id
      ORDER BY bills.created_at DESC
    `);
    return rows;
  }

  static async getById(id) {
    const [rows] = await db.query('SELECT * FROM bills WHERE id = ?', [id]);
    return rows[0];
  }

  static async getByOrderId(orderId) {
    const [rows] = await db.query('SELECT * FROM bills WHERE order_id = ? LIMIT 1', [orderId]);
    return rows[0];
  }

  static async getCheckoutContext(id) {
    const [rows] = await db.query(`
      SELECT
        bills.*,
        orders.customer_id,
        customers.name AS customer_name,
        customers.phone AS customer_phone
      FROM bills
      JOIN orders ON bills.order_id = orders.id
      LEFT JOIN customers ON orders.customer_id = customers.id
      WHERE bills.id = ?
      LIMIT 1
    `, [id]);
    return rows[0];
  }

  static async create(order_id, amount) {
    const [result] = await db.query(
      'INSERT INTO bills (order_id, amount) VALUES (?, ?)',
      [order_id, amount]
    );
    return result.insertId;
  }

  // Mark bill as paid and record the payment timestamp
  static async markPaid(id) {
    await db.query(
      'UPDATE bills SET status = "paid", paid_at = NOW() WHERE id = ?',
      [id]
    );
  }

  static async delete(id) {
    await db.query('DELETE FROM bills WHERE id = ?', [id]);
  }

  // For dashboard summary
  static async getSummary() {
    const [rows] = await db.query(`
      SELECT
        COUNT(*) AS total_bills,
        SUM(amount) AS total_revenue,
        SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) AS paid_revenue,
        SUM(CASE WHEN status = 'unpaid' THEN amount ELSE 0 END) AS unpaid_revenue
      FROM bills
    `);
    return rows[0];
  }
}

module.exports = Bill;
