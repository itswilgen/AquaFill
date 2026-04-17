const db = require('../db/connection');
const Bill = require('../models/Bill');

class BillRepository {
  async getAll() {
    return Bill.getAll();
  }

  async getById(id) {
    return Bill.getById(id);
  }

  async getByOrderId(orderId) {
    return Bill.getByOrderId(orderId);
  }

  async getCheckoutContext(id) {
    return Bill.getCheckoutContext(id);
  }

  async getByCustomerId(customerId) {
    const [rows] = await db.query(`
      SELECT
        orders.id,
        orders.quantity,
        orders.delivery_date,
        orders.created_at,
        bills.id AS bill_id,
        bills.amount,
        bills.status AS bill_status,
        bills.paid_at,
        bills.created_at AS bill_created_at,
        inventory.item_name,
        inventory.unit AS item_unit,
        payment_proofs.payment_method,
        payment_proofs.reference_no,
        payment_proofs.payer_name,
        payment_proofs.proof_url
      FROM bills
      JOIN orders ON bills.order_id = orders.id
      LEFT JOIN inventory ON orders.item_id = inventory.id
      LEFT JOIN payment_proofs ON bills.id = payment_proofs.bill_id
      WHERE orders.customer_id = ?
      ORDER BY bills.created_at DESC
    `, [customerId]);

    return rows;
  }

  async create({ order_id, amount }) {
    return Bill.create(order_id, amount);
  }

  async markPaid(id) {
    return Bill.markPaid(id);
  }

  async delete(id) {
    return Bill.delete(id);
  }

  async getSummary() {
    return Bill.getSummary();
  }
}

module.exports = BillRepository;
