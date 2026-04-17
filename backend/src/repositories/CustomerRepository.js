const db = require('../db/connection');
const Customer = require('../models/Customer');

class CustomerRepository {
  async getAll() {
    return Customer.getAll();
  }

  async getById(id) {
    return Customer.getById(id);
  }

  async getByUserId(userId) {
    const [rows] = await db.query(`
      SELECT customers.*
      FROM customers
      JOIN users ON users.customer_id = customers.id
      WHERE users.id = ?
      LIMIT 1
    `, [userId]);

    return rows[0] || null;
  }

  async create({ name, address, phone }) {
    return Customer.create(name, address, phone);
  }

  async update(id, { name, address, phone }) {
    return Customer.update(id, name, address, phone);
  }

  async delete(id) {
    return Customer.delete(id);
  }

  async search(keyword) {
    return Customer.search(keyword);
  }

  async findByNameExact(name) {
    return Customer.findByNameExact(name);
  }

  async findManyByNameExact(name) {
    return Customer.findManyByNameExact(name);
  }
}

module.exports = CustomerRepository;
