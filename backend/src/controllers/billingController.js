const BaseController = require('../core/BaseController');

class BillingController extends BaseController {
  constructor({ billingService }) {
    super();
    this.billingService = billingService;
  }

  getAll = async (req, res) => {
    const bills = await this.billingService.getAll();
    return this.ok(res, bills);
  };

  getMine = async (req, res) => {
    const bills = await this.billingService.getBySessionUser(req.user);
    return this.ok(res, bills);
  };

  markPaid = async (req, res) => {
    const payload = {
      ...(req.body || {}),
      ...(req.file ? { proof_file: req.file } : {}),
    };
    const result = await this.billingService.markPaid(req.params.id, payload, req.user);
    return this.message(res, result.message);
  };

  delete = async (req, res) => {
    await this.billingService.delete(req.params.id);
    return this.message(res, 'Bill deleted');
  };

  getSummary = async (req, res) => {
    const summary = await this.billingService.getSummary();
    return this.ok(res, summary);
  };
}

module.exports = BillingController;
