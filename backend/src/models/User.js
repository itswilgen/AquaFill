const db = require('../db/connection');
const bcrypt = require('bcryptjs');

class User {
  constructor(id, username, password, role, created_at) {
    this.id = id;
    this.username = username;
    this.password = password;
    this.role = role;
    this.created_at = created_at;
  }

  static async findByUsername(username) {
    const [rows] = await db.query(
      'SELECT * FROM users WHERE username = ?', [username]
    );
    return rows[0];
  }

  static async create(username, plainPassword, role = 'staff', name = null, email = null, customerId = null) {
    const hashed = await bcrypt.hash(plainPassword, 12);
    const [result] = await db.query(
      'INSERT INTO users (username, password, role, name, email, customer_id) VALUES (?, ?, ?, ?, ?, ?)',
      [username, hashed, role, name, email, customerId]
    );
    return result.insertId;
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}

module.exports = User;
