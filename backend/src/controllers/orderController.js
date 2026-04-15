const BaseController = require('../core/BaseController');

class OrderController extends BaseController {
  constructor({ orderService }) {
    super();
    this.orderService = orderService;
  }

  getForRider = async (req, res) => {
    const rows = await this.orderService.getForRider();
    return this.ok(res, rows);
  };

  getByCustomer = async (req, res) => {
    const rows = await this.orderService.getByCustomer(req.params.customer_id);
    return this.ok(res, rows);
  };

  getAll = async (req, res) => {
    const orders = await this.orderService.getAll();
    return this.ok(res, orders);
  };

  getById = async (req, res) => {
    const order = await this.orderService.getById(req.params.id);
    return this.ok(res, order);
  };

  create = async (req, res) => {
    const orderId = await this.orderService.create(req.body || {});
    return this.created(res, { message: 'Order and bill created', orderId });
  };

  updateStatus = async (req, res) => {
    await this.orderService.updateStatus(req.params.id, req.body?.status);
    return this.message(res, 'Order status updated');
  };

  riderConfirmDelivery = async (req, res) => {
    const result = await this.orderService.riderConfirmDelivery(req.params.id, req.body?.cod_paid);
    return res.json({ success: true, ...result });
  };

  delete = async (req, res) => {
    await this.orderService.delete(req.params.id);
    return this.message(res, 'Order deleted');
  };
}

module.exports = OrderController;
