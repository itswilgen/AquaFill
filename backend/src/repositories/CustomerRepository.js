const Customer = require('../models/Customer');

class CustomerRepository {
  async getAll() {
    return Customer.getAll();
  }

  async getById(id) {
    return Customer.getById(id);
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
}

module.exports = CustomerRepository;
