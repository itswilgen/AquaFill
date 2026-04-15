const Bill = require('../models/Bill');

class BillRepository {
  async getAll() {
    return Bill.getAll();
  }

  async getById(id) {
    return Bill.getById(id);
  }

  async getByOrderId(orderId) {
    return Bill.getByOrderId(orderId);
  }

  async create({ order_id, amount }) {
    return Bill.create(order_id, amount);
  }

  async markPaid(id) {
    return Bill.markPaid(id);
  }

  async delete(id) {
    return Bill.delete(id);
  }

  async getSummary() {
    return Bill.getSummary();
  }
}

module.exports = BillRepository;
