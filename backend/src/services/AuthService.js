const jwt = require('jsonwebtoken');
const AppError = require('../core/AppError');

const ALLOWED_SELF_SIGNUP_ROLE = 'customer';

class AuthService {
  constructor({ userRepository, customerRepository, jwtSecret, firebaseTokenVerifier }) {
    this.userRepository = userRepository;
    this.customerRepository = customerRepository;
    this.jwtSecret = jwtSecret;
    this.firebaseTokenVerifier = firebaseTokenVerifier;
    this.schemaReady = false;
  }

  async ensureSchema() {
    if (this.schemaReady) return;
    await this.userRepository.ensureSecuritySchema();
    this.schemaReady = true;
  }

  normalizeUsername(value) {
    const normalized = String(value || '').trim().toLowerCase();

    if (!normalized) {
      throw new AppError('Username is required', 400, 'VALIDATION_ERROR');
    }

    if (!/^[a-z0-9_.-]{4,30}$/.test(normalized)) {
      throw new AppError(
        'Username must be 4-30 characters and use only letters, numbers, dot, underscore, or hyphen.',
        400,
        'VALIDATION_ERROR'
      );
    }

    return normalized;
  }

  normalizeEmail(value) {
    const normalized = String(value || '').trim().toLowerCase();
    if (!normalized) return '';

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(normalized)) {
      throw new AppError('Invalid email address format', 400, 'VALIDATION_ERROR');
    }

    return normalized;
  }

  sanitizeName(value, fallback = '') {
    return String(value || fallback || '').trim().slice(0, 120);
  }

  sanitizeAddress(value) {
    return String(value || '').trim().slice(0, 255);
  }

  sanitizePhone(value) {
    return String(value || '').trim().slice(0, 40);
  }

  validatePassword(passwordValue) {
    const password = String(passwordValue || '');

    if (password.length < 8 || password.length > 72) {
      throw new AppError('Password must be between 8 and 72 characters long', 400, 'VALIDATION_ERROR');
    }

    if (!/[a-z]/.test(password)
      || !/[A-Z]/.test(password)
      || !/[0-9]/.test(password)
      || !/[^A-Za-z0-9]/.test(password)) {
      throw new AppError(
        'Password must include uppercase, lowercase, number, and special character.',
        400,
        'VALIDATION_ERROR'
      );
    }

    return password;
  }

  async login({ username, password }) {
    await this.ensureSchema();

    const loginValue = String(username || '').trim();
    if (!loginValue || !password) {
      throw new AppError('Username and password required', 400, 'VALIDATION_ERROR');
    }

    const normalizedLogin = loginValue.toLowerCase();
    let user = await this.userRepository.findByUsername(normalizedLogin);

    if (!user) {
      // Backward compatibility for older mixed-case usernames.
      user = await this.userRepository.findByUsername(loginValue);
    }

    if (!user && normalizedLogin.includes('@')) {
      user = await this.userRepository.findByEmail(normalizedLogin);
    }

    if (!user || !user.password) {
      throw new AppError('Invalid credentials', 401, 'AUTH_INVALID_CREDENTIALS');
    }

    const valid = await this.userRepository.verifyPassword(password, user.password);
    if (!valid) {
      throw new AppError('Invalid credentials', 401, 'AUTH_INVALID_CREDENTIALS');
    }

    const hydratedUser = await this.ensureCustomerLink(user, {
      name: user.name || user.username,
      address: user.address || null,
      phone: user.phone || null,
    });

    return {
      token: this.signToken(hydratedUser),
      user: {
        id: hydratedUser.id,
        username: hydratedUser.username,
        role: hydratedUser.role,
        name: hydratedUser.name || hydratedUser.username,
        customer_id: hydratedUser.customer_id || null,
      },
    };
  }

  async register({ username, password, role, name, address, phone, email }) {
    await this.ensureSchema();

    const normalizedUsername = this.normalizeUsername(username);
    const normalizedPassword = this.validatePassword(password);
    const normalizedName = this.sanitizeName(name, normalizedUsername);
    const normalizedAddress = this.sanitizeAddress(address);
    const normalizedPhone = this.sanitizePhone(phone);
    const normalizedEmail = this.normalizeEmail(email);

    if (role && role !== ALLOWED_SELF_SIGNUP_ROLE) {
      throw new AppError('Role escalation is not allowed in public signup', 403, 'AUTH_FORBIDDEN_ROLE');
    }

    if (!normalizedName) {
      throw new AppError('Full name is required', 400, 'VALIDATION_ERROR');
    }

    if (!normalizedAddress) {
      throw new AppError('House address is required for customer signup', 400, 'VALIDATION_ERROR');
    }

    if (normalizedAddress.length < 10) {
      throw new AppError('Please provide a complete house address', 400, 'VALIDATION_ERROR');
    }

    const existing = await this.userRepository.findByUsername(normalizedUsername);
    if (existing) {
      throw new AppError('Username already exists', 409, 'AUTH_USERNAME_EXISTS');
    }

    if (normalizedEmail) {
      const existingEmail = await this.userRepository.findByEmail(normalizedEmail);
      if (existingEmail) {
        throw new AppError('Email is already registered', 409, 'AUTH_EMAIL_EXISTS');
      }
    }

    const customerId = await this.ensureCustomerRecord({
      name: normalizedName,
      address: normalizedAddress,
      phone: normalizedPhone || null,
      existingCustomerId: null,
      allowNameReuse: false,
    });

    const id = await this.userRepository.create({
      username: normalizedUsername,
      password: normalizedPassword,
      role: ALLOWED_SELF_SIGNUP_ROLE,
      name: normalizedName,
      email: normalizedEmail || null,
      customerId,
    });

    return { id };
  }

  async googleLogin({ id_token, name }) {
    await this.ensureSchema();

    if (!this.firebaseTokenVerifier) {
      throw new AppError('Google login is not configured', 500, 'CONFIG_ERROR');
    }

    const verified = await this.firebaseTokenVerifier.verifyIdToken(id_token);
    const uid = verified.uid;
    const email = verified.email;

    let user = await this.userRepository.findByGoogleUidOrEmail(uid, email);

    if (user && user.google_uid && user.google_uid !== uid) {
      throw new AppError('Google account does not match this user', 401, 'AUTH_INVALID_GOOGLE_ACCOUNT');
    }

    if (user && String(user.role || '').toLowerCase() !== 'customer') {
      throw new AppError('Google login is not enabled for this account type', 403, 'AUTH_FORBIDDEN');
    }

    const fallbackName = String(email || '').split('@')[0] || 'customer';
    const resolvedName = this.sanitizeName(name, verified.name || fallbackName);

    if (!user) {
      const username = await this.generateUniqueUsername(fallbackName);

      const customerId = await this.ensureCustomerRecord({
        name: resolvedName,
        address: null,
        phone: null,
        existingCustomerId: null,
        allowNameReuse: false,
      });

      user = await this.userRepository.createGoogleUser({
        username,
        uid,
        name: resolvedName,
        email,
        customerId,
      });
    } else {
      if (!user.google_uid) {
        await this.userRepository.updateGoogleUid(user.id, uid);
        user.google_uid = uid;
      }

      user = await this.ensureCustomerLink(user, {
        name: user.name || resolvedName || user.username,
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
        customer_id: user.customer_id || null,
      },
    };
  }

  async ensureCustomerLink(user, { name, address = null, phone = null } = {}) {
    if (!user || String(user.role || '').toLowerCase() !== 'customer') {
      return user;
    }

    const customerId = await this.ensureCustomerRecord({
      name,
      address,
      phone,
      existingCustomerId: user.customer_id || null,
      allowNameReuse: true,
    });

    if (!customerId) {
      return {
        ...user,
        customer_id: null,
      };
    }

    if (Number(user.customer_id || 0) !== customerId) {
      await this.userRepository.updateCustomerLink(user.id, customerId);
    }

    return {
      ...user,
      customer_id: customerId,
    };
  }

  async ensureCustomerRecord({
    name,
    address = null,
    phone = null,
    existingCustomerId = null,
    allowNameReuse = false,
  }) {
    const parsedId = Number.parseInt(existingCustomerId, 10);
    if (Number.isInteger(parsedId) && parsedId > 0) {
      const current = await this.customerRepository.getById(parsedId);
      if (current) return parsedId;
    }

    const normalizedName = this.sanitizeName(name);
    if (!normalizedName) return null;

    if (allowNameReuse) {
      const matches = await this.customerRepository.findManyByNameExact(normalizedName);
      if (matches.length === 1) {
        return Number(matches[0].id);
      }
    }

    const customerId = await this.customerRepository.create({
      name: normalizedName,
      address: this.sanitizeAddress(address) || null,
      phone: this.sanitizePhone(phone) || null,
    });

    return Number(customerId);
  }

  signToken(user) {
    if (!this.jwtSecret) {
      throw new AppError('JWT secret is not configured', 500, 'CONFIG_ERROR');
    }

    return jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
        customer_id: user.customer_id || null,
      },
      this.jwtSecret,
      {
        expiresIn: '8h',
        issuer: 'aquafill-api',
      }
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
