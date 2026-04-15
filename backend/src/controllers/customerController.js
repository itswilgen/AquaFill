const BaseController = require('../core/BaseController');

class CustomerController extends BaseController {
  constructor({ customerService }) {
    super();
    this.customerService = customerService;
  }

  getAll = async (req, res) => {
    const customers = await this.customerService.getAll();
    return this.ok(res, customers);
  };

  getById = async (req, res) => {
    const customer = await this.customerService.getById(req.params.id);
    return this.ok(res, customer);
  };

  create = async (req, res) => {
    const id = await this.customerService.create(req.body || {});
    return this.created(res, { message: 'Customer created', id });
  };

  update = async (req, res) => {
    await this.customerService.update(req.params.id, req.body || {});
    return this.message(res, 'Customer updated');
  };

  delete = async (req, res) => {
    await this.customerService.delete(req.params.id);
    return this.message(res, 'Customer deleted');
  };

  search = async (req, res) => {
    const customers = await this.customerService.search(req.query.q);
    return this.ok(res, customers);
  };
}

module.exports = CustomerController;
