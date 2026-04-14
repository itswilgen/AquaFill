const Order = require('../models/Order');
const Bill  = require('../models/Bill');
const db    = require('../db/connection');


class OrderController {

  static async getForRider(req, res) {
    try {
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
      res.json({ success: true, data: rows });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async getByCustomer(req, res) {
    try {
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
      `, [req.params.customer_id]);
      res.json({ success: true, data: rows });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
  static async getAll(req, res) {
    try {
      const orders = await Order.getAll();
      res.json({ success: true, data: orders });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async getById(req, res) {
    try {
      const order = await Order.getById(req.params.id);
      if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
      res.json({ success: true, data: order });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async create(req, res) {
    try {
      const { customer_id, quantity, delivery_date, amount } = req.body;
      if (!customer_id || !quantity || !amount) {
        return res.status(400).json({ success: false, message: 'customer_id, quantity and amount are required' });
      }
      // Create the order first
      const orderId = await Order.create(customer_id, quantity, delivery_date);
      // Automatically create a bill for this order
      await Bill.create(orderId, amount);
      res.status(201).json({ success: true, message: 'Order and bill created', orderId });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async updateStatus(req, res) {
    try {
      const { status } = req.body;
      await Order.updateStatus(req.params.id, status);
      res.json({ success: true, message: 'Order status updated' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async riderConfirmDelivery(req, res) {
    try {
      const orderId = Number.parseInt(req.params.id, 10);
      if (!Number.isInteger(orderId) || orderId <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid order id' });
      }

      const codPaidValue = req.body?.cod_paid;
      const codPaid = codPaidValue === true
        || codPaidValue === 'true'
        || codPaidValue === 1
        || codPaidValue === '1';

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

      const order = rows[0];
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      if (order.status === 'cancelled') {
        return res.status(400).json({ success: false, message: 'Cancelled orders cannot be confirmed' });
      }

      if (order.status !== 'delivered') {
        await Order.updateStatus(orderId, 'delivered');
      }

      let codAutoPaid = false;
      if (codPaid && order.bill_id && String(order.bill_status || '').toLowerCase() !== 'paid') {
        await Bill.markPaid(order.bill_id);
        codAutoPaid = true;
      }

      res.json({
        success: true,
        message: codAutoPaid
          ? 'Delivery confirmed and COD payment marked as paid.'
          : 'Delivery confirmed.',
        data: {
          order_id: orderId,
          status: 'delivered',
          cod_auto_paid: codAutoPaid,
          bill_id: order.bill_id || null,
        },
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async delete(req, res) {
    try {
      await Order.delete(req.params.id);
      res.json({ success: true, message: 'Order deleted' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}



module.exports = OrderController;
