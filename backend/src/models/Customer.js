const db = require('../db/connection');

class Customer {
  // Constructor defines the shape of a Customer object
  constructor(id, name, address, phone, balance, created_at) {
    this.id         = id;
    this.name       = name;
    this.address    = address;
    this.phone      = phone;
    this.balance    = balance;
    this.created_at = created_at;
  }

  // Static methods don't need an instance — call as Customer.getAll()
  static async getAll() {
    const [rows] = await db.query('SELECT * FROM customers ORDER BY created_at DESC');
    return rows;
  }

  static async getById(id) {
    const [rows] = await db.query('SELECT * FROM customers WHERE id = ?', [id]);
    return rows[0]; // return single customer
  }

  static async create(name, address, phone) {
    const [result] = await db.query(
      'INSERT INTO customers (name, address, phone) VALUES (?, ?, ?)',
      [name, address, phone]
    );
    return result.insertId; // returns the new customer's ID
  }

  static async findByNameExact(name) {
    const [rows] = await db.query(
      'SELECT * FROM customers WHERE LOWER(name) = LOWER(?) LIMIT 1',
      [name]
    );
    return rows[0];
  }

  static async findManyByNameExact(name) {
    const [rows] = await db.query(
      'SELECT * FROM customers WHERE LOWER(name) = LOWER(?) ORDER BY id ASC',
      [name]
    );
    return rows;
  }

  static async update(id, name, address, phone) {
    await db.query(
      'UPDATE customers SET name = ?, address = ?, phone = ? WHERE id = ?',
      [name, address, phone, id]
    );
  }

  static async delete(id) {
    await db.query('DELETE FROM customers WHERE id = ?', [id]);
  }

  static async search(keyword) {
    const [rows] = await db.query(
      'SELECT * FROM customers WHERE name LIKE ? OR phone LIKE ?',
      [`%${keyword}%`, `%${keyword}%`]
    );
    return rows;
  }
}

module.exports = Customer;
