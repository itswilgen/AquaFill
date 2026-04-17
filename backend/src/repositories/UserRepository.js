const db = require('../db/connection');
const User = require('../models/User');

class UserRepository {
  constructor() {
    this.securitySchemaReady = false;
  }

  async ensureSecuritySchema() {
    if (this.securitySchemaReady) return;

    const [customerIdColumns] = await db.query(`
      SELECT 1
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'users'
        AND COLUMN_NAME = 'customer_id'
      LIMIT 1
    `);

    if (customerIdColumns.length === 0) {
      await db.query('ALTER TABLE users ADD COLUMN customer_id INT NULL AFTER email');
    }

    const [indexes] = await db.query(`
      SELECT 1
      FROM INFORMATION_SCHEMA.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'users'
        AND INDEX_NAME = 'idx_users_customer_id'
      LIMIT 1
    `);

    if (indexes.length === 0) {
      await db.query('ALTER TABLE users ADD INDEX idx_users_customer_id (customer_id)');
    }

    const [constraints] = await db.query(`
      SELECT 1
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'users'
        AND COLUMN_NAME = 'customer_id'
        AND REFERENCED_TABLE_NAME = 'customers'
      LIMIT 1
    `);

    if (constraints.length === 0) {
      try {
        await db.query(`
          ALTER TABLE users
          ADD CONSTRAINT fk_users_customer
          FOREIGN KEY (customer_id) REFERENCES customers(id)
          ON DELETE SET NULL
          ON UPDATE CASCADE
        `);
      } catch {
        // Keep startup resilient if FK already exists under a different name.
      }
    }

    this.securitySchemaReady = true;
  }

  async findById(id) {
    const [rows] = await db.query('SELECT * FROM users WHERE id = ? LIMIT 1', [id]);
    return rows[0] || null;
  }

  async findByUsername(username) {
    return User.findByUsername(username);
  }

  async findByEmail(email) {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
    return rows[0] || null;
  }

  async create({ username, password, role, name, email, customerId = null }) {
    return User.create(username, password, role, name, email, customerId);
  }

  async verifyPassword(plainPassword, hashedPassword) {
    return User.verifyPassword(plainPassword, hashedPassword);
  }

  async findByGoogleUidOrEmail(uid, email) {
    const [rows] = await db.query(
      'SELECT * FROM users WHERE google_uid = ? OR email = ? OR username = ? LIMIT 1',
      [uid, email, email]
    );
    return rows[0] || null;
  }

  async createGoogleUser({ username, uid, name, email, customerId = null }) {
    const [result] = await db.query(
      `INSERT INTO users (username, password, role, google_uid, name, email, customer_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [username, '', 'customer', uid, name || username, email, customerId]
    );

    const [rows] = await db.query('SELECT * FROM users WHERE id = ? LIMIT 1', [result.insertId]);
    return rows[0] || null;
  }

  async updateCustomerLink(userId, customerId) {
    await db.query('UPDATE users SET customer_id = ? WHERE id = ?', [customerId, userId]);
  }

  async updateGoogleUid(userId, uid) {
    await db.query('UPDATE users SET google_uid = ? WHERE id = ?', [uid, userId]);
  }
}

module.exports = UserRepository;
