const AppError = require('../core/AppError');

class CustomerService {
  constructor({ customerRepository }) {
    this.customerRepository = customerRepository;
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

  parseId(value, label = 'id') {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      throw new AppError(`Invalid ${label}`, 400, 'VALIDATION_ERROR');
    }
    return parsed;
  }

  async getAll() {
    return this.customerRepository.getAll();
  }

  async getById(id) {
    const customerId = this.parseId(id, 'customer id');
    const customer = await this.customerRepository.getById(customerId);
    if (!customer) {
      throw new AppError('Customer not found', 404, 'CUSTOMER_NOT_FOUND');
    }
    return customer;
  }

  async getBySessionUser(user) {
    if (!user || String(user.role || '').toLowerCase() !== 'customer') {
      throw new AppError('Only customer accounts can access this route', 403, 'AUTH_FORBIDDEN');
    }

    let customer = null;
    const tokenCustomerId = Number.parseInt(user.customer_id, 10);
    if (Number.isInteger(tokenCustomerId) && tokenCustomerId > 0) {
      customer = await this.customerRepository.getById(tokenCustomerId);
    }

    if (!customer) {
      customer = await this.customerRepository.getByUserId(user.id);
    }

    if (!customer) {
      throw new AppError('Customer profile not found for this account', 404, 'CUSTOMER_NOT_FOUND');
    }

    return customer;
  }

  async create({ name, address, phone }) {
    const normalizedName = this.sanitizeName(name);
    if (!normalizedName) {
      throw new AppError('Name is required', 400, 'VALIDATION_ERROR');
    }

    const normalizedAddress = this.sanitizeAddress(address);
    if (!normalizedAddress) {
      throw new AppError('Address is required', 400, 'VALIDATION_ERROR');
    }

    return this.customerRepository.create({
      name: normalizedName,
      address: normalizedAddress,
      phone: this.sanitizePhone(phone) || null,
    });
  }

  async update(id, { name, address, phone }) {
    const customerId = this.parseId(id, 'customer id');
    const existing = await this.customerRepository.getById(customerId);
    if (!existing) {
      throw new AppError('Customer not found', 404, 'CUSTOMER_NOT_FOUND');
    }

    const normalizedName = this.sanitizeName(name, existing.name);
    const normalizedAddress = this.sanitizeAddress(address || existing.address);
    const normalizedPhone = this.sanitizePhone(phone || existing.phone);

    if (!normalizedName) {
      throw new AppError('Name is required', 400, 'VALIDATION_ERROR');
    }

    await this.customerRepository.update(customerId, {
      name: normalizedName,
      address: normalizedAddress || null,
      phone: normalizedPhone || null,
    });
  }

  async updateBySessionUser(user, payload) {
    const customer = await this.getBySessionUser(user);

    const normalizedName = this.sanitizeName(payload?.name, customer.name || user.name || user.username);
    const normalizedAddress = this.sanitizeAddress(payload?.address || customer.address);
    const normalizedPhone = this.sanitizePhone(payload?.phone || customer.phone);

    if (!normalizedName) {
      throw new AppError('Name is required', 400, 'VALIDATION_ERROR');
    }

    await this.customerRepository.update(customer.id, {
      name: normalizedName,
      address: normalizedAddress || null,
      phone: normalizedPhone || null,
    });

    return customer.id;
  }

  async delete(id) {
    const customerId = this.parseId(id, 'customer id');
    return this.customerRepository.delete(customerId);
  }

  async search(keyword) {
    const value = String(keyword || '').trim();
    if (!value) return [];

    return this.customerRepository.search(value);
  }
}

module.exports = CustomerService;
