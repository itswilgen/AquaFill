const Customer = require('../models/Customer');

class CustomerController {
  static async getAll(req, res) {
    try {
      const customers = await Customer.getAll();
      res.json({ success: true, data: customers });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async getById(req, res) {
    try {
      const customer = await Customer.getById(req.params.id);
      if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
      res.json({ success: true, data: customer });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async create(req, res) {
    try {
      const { name, address, phone } = req.body;
      if (!name) return res.status(400).json({ success: false, message: 'Name is required' });
      const id = await Customer.create(name, address, phone);
      res.status(201).json({ success: true, message: 'Customer created', id });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async update(req, res) {
    try {
      const { name, address, phone } = req.body;
      await Customer.update(req.params.id, name, address, phone);
      res.json({ success: true, message: 'Customer updated' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async delete(req, res) {
    try {
      await Customer.delete(req.params.id);
      res.json({ success: true, message: 'Customer deleted' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async search(req, res) {
    try {
      const customers = await Customer.search(req.query.q);
      res.json({ success: true, data: customers });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = CustomerController;