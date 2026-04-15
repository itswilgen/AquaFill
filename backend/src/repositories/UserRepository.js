const db = require('../db/connection');
const User = require('../models/User');

class UserRepository {
  async findByUsername(username) {
    return User.findByUsername(username);
  }

  async create({ username, password, role, name, email }) {
    return User.create(username, password, role, name, email);
  }

  async verifyPassword(plainPassword, hashedPassword) {
    return User.verifyPassword(plainPassword, hashedPassword);
  }

  async findByGoogleUidOrUsername(uid, username) {
    const [rows] = await db.query(
      'SELECT * FROM users WHERE google_uid = ? OR username = ? LIMIT 1',
      [uid, username]
    );
    return rows[0] || null;
  }

  async createGoogleUser({ username, uid, name, email }) {
    const [result] = await db.query(
      'INSERT INTO users (username, password, role, google_uid, name, email) VALUES (?, ?, ?, ?, ?, ?)',
      [username, '', 'customer', uid, name || username, email]
    );

    const [rows] = await db.query('SELECT * FROM users WHERE id = ? LIMIT 1', [result.insertId]);
    return rows[0] || null;
  }
}

module.exports = UserRepository;
