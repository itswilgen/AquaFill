const db  = require('../db/connection');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Customer = require('../models/Customer');

async function ensureCustomerRecord({ name, address = null, phone = null }) {
  const normalizedName = String(name || '').trim();
  if (!normalizedName) return;

  const existing = await Customer.findByNameExact(normalizedName);
  if (existing) return;

  await Customer.create(normalizedName, address || null, phone || null);
}

class AuthController {

  static async login(req, res) {
    try {
      const { username, password } = req.body;
      if (!username || !password)
        return res.status(400).json({ success: false, message: 'Username and password required' });

      const user = await User.findByUsername(username);
      if (!user)
        return res.status(401).json({ success: false, message: 'Invalid credentials' });

      const valid = await User.verifyPassword(password, user.password);
      if (!valid)
        return res.status(401).json({ success: false, message: 'Invalid credentials' });

      if (user.role === 'customer') {
        await ensureCustomerRecord({
          name: user.name || user.username,
          address: user.address || null,
          phone: user.phone || null,
        });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
      );

      res.json({
        success: true,
        token,
        user: { id: user.id, username: user.username, role: user.role, name: user.name || user.username },
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async register(req, res) {
    try {
      const { username, password, role, name, address, phone, email } = req.body;
      const normalizedUsername = String(username || '').trim();
      const normalizedPassword = String(password || '');
      const resolvedRole = role || 'customer';
      const resolvedName = String(name || normalizedUsername).trim();
      const normalizedAddress = String(address || '').trim();
      const normalizedPhone = String(phone || '').trim();
      const normalizedEmail = String(email || '').trim();

      if (!normalizedUsername || !normalizedPassword)
        return res.status(400).json({ success: false, message: 'Username and password required' });

      if (resolvedRole === 'customer') {
        if (!normalizedAddress) {
          return res.status(400).json({ success: false, message: 'House address is required for customer signup' });
        }
        if (normalizedAddress.length < 10) {
          return res.status(400).json({ success: false, message: 'Please provide a complete house address' });
        }
      }

      const existing = await User.findByUsername(normalizedUsername);
      if (existing)
        return res.status(409).json({ success: false, message: 'Username already exists' });

      const id = await User.create(
        normalizedUsername,
        normalizedPassword,
        resolvedRole,
        resolvedName,
        normalizedEmail || null
      );

      if (resolvedRole === 'customer') {
        await ensureCustomerRecord({
          name: resolvedName,
          address: normalizedAddress || null,
          phone: normalizedPhone || null,
        });
      }

      res.status(201).json({ success: true, message: 'User created', id });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async googleLogin(req, res) {
    try {
      const { uid, email, name, photoURL } = req.body;

      if (!uid || !email)
        return res.status(400).json({ success: false, message: 'Invalid Google credentials' });

      const [existing] = await db.query(
        'SELECT * FROM users WHERE google_uid = ? OR username = ?',
        [uid, email]
      );

      let user = existing[0];

      if (!user) {
        const username = email.split('@')[0] + '_' + Math.floor(Math.random() * 1000);
        const [result] = await db.query(
          'INSERT INTO users (username, password, role, google_uid, name, email) VALUES (?, ?, ?, ?, ?, ?)',
          [username, '', 'customer', uid, name || username, email]
        );
        const [newUser] = await db.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
        user = newUser[0];
      }

      if (user.role === 'customer') {
        await ensureCustomerRecord({
          name: user.name || name || user.username,
          address: user.address || null,
          phone: user.phone || null,
        });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
      );

      res.json({
        success: true,
        token,
        user: { id: user.id, username: user.username, role: user.role, name: user.name }
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

}

module.exports = AuthController;
