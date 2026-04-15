const AppError = require('../core/AppError');

class CustomerService {
  constructor({ customerRepository }) {
    this.customerRepository = customerRepository;
  }

  async getAll() {
    return this.customerRepository.getAll();
  }

  async getById(id) {
    const customer = await this.customerRepository.getById(id);
    if (!customer) {
      throw new AppError('Customer not found', 404, 'CUSTOMER_NOT_FOUND');
    }
    return customer;
  }

  async create({ name, address, phone }) {
    if (!name) {
      throw new AppError('Name is required', 400, 'VALIDATION_ERROR');
    }

    return this.customerRepository.create({ name, address, phone });
  }

  async update(id, { name, address, phone }) {
    return this.customerRepository.update(id, { name, address, phone });
  }

  async delete(id) {
    return this.customerRepository.delete(id);
  }

  async search(keyword) {
    const value = String(keyword || '').trim();
    if (!value) return [];
    return this.customerRepository.search(value);
  }
}

module.exports = CustomerService;
