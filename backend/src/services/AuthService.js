const jwt = require('jsonwebtoken');
const AppError = require('../core/AppError');

class AuthService {
  constructor({ userRepository, customerRepository, jwtSecret }) {
    this.userRepository = userRepository;
    this.customerRepository = customerRepository;
    this.jwtSecret = jwtSecret;
  }

  async login({ username, password }) {
    if (!username || !password) {
      throw new AppError('Username and password required', 400, 'VALIDATION_ERROR');
    }

    const user = await this.userRepository.findByUsername(username);
    if (!user) {
      throw new AppError('Invalid credentials', 401, 'AUTH_INVALID_CREDENTIALS');
    }

    const valid = await this.userRepository.verifyPassword(password, user.password);
    if (!valid) {
      throw new AppError('Invalid credentials', 401, 'AUTH_INVALID_CREDENTIALS');
    }

    if (user.role === 'customer') {
      await this.ensureCustomerRecord({
        name: user.name || user.username,
        address: user.address || null,
        phone: user.phone || null,
      });
    }

    return {
      token: this.signToken(user),
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name || user.username,
      },
    };
  }

  async register({ username, password, role, name, address, phone, email }) {
    const normalizedUsername = String(username || '').trim();
    const normalizedPassword = String(password || '');
    const resolvedRole = role || 'customer';
    const resolvedName = String(name || normalizedUsername).trim();
    const normalizedAddress = String(address || '').trim();
    const normalizedPhone = String(phone || '').trim();
    const normalizedEmail = String(email || '').trim();

    if (!normalizedUsername || !normalizedPassword) {
      throw new AppError('Username and password required', 400, 'VALIDATION_ERROR');
    }

    if (resolvedRole === 'customer') {
      if (!normalizedAddress) {
        throw new AppError('House address is required for customer signup', 400, 'VALIDATION_ERROR');
      }
      if (normalizedAddress.length < 10) {
        throw new AppError('Please provide a complete house address', 400, 'VALIDATION_ERROR');
      }
    }

    const existing = await this.userRepository.findByUsername(normalizedUsername);
    if (existing) {
      throw new AppError('Username already exists', 409, 'AUTH_USERNAME_EXISTS');
    }

    const id = await this.userRepository.create({
      username: normalizedUsername,
      password: normalizedPassword,
      role: resolvedRole,
      name: resolvedName,
      email: normalizedEmail || null,
    });

    if (resolvedRole === 'customer') {
      await this.ensureCustomerRecord({
        name: resolvedName,
        address: normalizedAddress || null,
        phone: normalizedPhone || null,
      });
    }

    return { id };
  }

  async googleLogin({ uid, email, name }) {
    if (!uid || !email) {
      throw new AppError('Invalid Google credentials', 400, 'VALIDATION_ERROR');
    }

    let user = await this.userRepository.findByGoogleUidOrUsername(uid, email);

    if (!user) {
      const base = String(email || '').split('@')[0] || 'customer';
      const username = await this.generateUniqueUsername(base);
      user = await this.userRepository.createGoogleUser({
        username,
        uid,
        name,
        email,
      });
    }

    if (user.role === 'customer') {
      await this.ensureCustomerRecord({
        name: user.name || name || user.username,
        address: user.address || null,
        phone: user.phone || null,
      });
    }

    return {
      token: this.signToken(user),
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name,
      },
    };
  }

  async ensureCustomerRecord({ name, address = null, phone = null }) {
    const normalizedName = String(name || '').trim();
    if (!normalizedName) return;

    const existing = await this.customerRepository.findByNameExact(normalizedName);
    if (existing) return;

    await this.customerRepository.create({
      name: normalizedName,
      address: address || null,
      phone: phone || null,
    });
  }

  signToken(user) {
    if (!this.jwtSecret) {
      throw new AppError('JWT secret is not configured', 500, 'CONFIG_ERROR');
    }

    return jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      this.jwtSecret,
      { expiresIn: '8h' }
    );
  }

  async generateUniqueUsername(base) {
    const cleanedBase = String(base || 'customer')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/_+/g, '_')
      .slice(0, 20) || 'customer';

    for (let attempt = 0; attempt < 20; attempt += 1) {
      const suffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      const candidate = `${cleanedBase}_${suffix}`;
      const existing = await this.userRepository.findByUsername(candidate);
      if (!existing) return candidate;
    }

    throw new AppError('Could not generate unique username', 500, 'AUTH_USERNAME_GENERATION_FAILED');
  }
}

module.exports = AuthService;
