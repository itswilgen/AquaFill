const AppError = require('../core/AppError');

class OrderService {
  constructor({ orderRepository, billRepository, paymentProofRepository }) {
    this.orderRepository = orderRepository;
    this.billRepository = billRepository;
    this.paymentProofRepository = paymentProofRepository;
  }

  async getForRider() {
    return this.orderRepository.getForRiderQueue();
  }

  async getByCustomer(customerId) {
    return this.orderRepository.getByCustomerId(customerId);
  }

  async getAll() {
    return this.orderRepository.getAll();
  }

  async getById(id) {
    const order = await this.orderRepository.getById(id);
    if (!order) {
      throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
    }

    return order;
  }

  async create({ customer_id, quantity, delivery_date, amount }) {
    if (!customer_id || !quantity || !amount) {
      throw new AppError('customer_id, quantity and amount are required', 400, 'VALIDATION_ERROR');
    }

    const orderId = await this.orderRepository.create({
      customer_id,
      quantity,
      delivery_date,
    });

    await this.billRepository.create({
      order_id: orderId,
      amount,
    });

    return orderId;
  }

  async updateStatus(id, status) {
    return this.orderRepository.updateStatus(id, status);
  }

  async riderConfirmDelivery(orderIdValue, codPaidValue) {
    const orderId = Number.parseInt(orderIdValue, 10);
    if (!Number.isInteger(orderId) || orderId <= 0) {
      throw new AppError('Invalid order id', 400, 'VALIDATION_ERROR');
    }

    const codPaid = codPaidValue === true
      || codPaidValue === 'true'
      || codPaidValue === 1
      || codPaidValue === '1';

    const order = await this.orderRepository.getDeliveryContext(orderId);
    if (!order) {
      throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
    }

    if (order.status === 'cancelled') {
      throw new AppError('Cancelled orders cannot be confirmed', 400, 'ORDER_CANCELLED');
    }

    if (order.status !== 'delivered') {
      await this.orderRepository.updateStatus(orderId, 'delivered');
    }

    let codAutoPaid = false;
    if (codPaid && order.bill_id && String(order.bill_status || '').toLowerCase() !== 'paid') {
      await this.billRepository.markPaid(order.bill_id);
      await this.paymentProofRepository.saveForBill({
        billId: order.bill_id,
        paymentMethod: 'cod',
        referenceNo: 'COD',
        payerName: 'Cash on Delivery',
        proofUrl: 'COD',
      });
      codAutoPaid = true;
    }

    return {
      message: codAutoPaid
        ? 'Delivery confirmed and COD payment marked as paid.'
        : 'Delivery confirmed.',
      data: {
        order_id: orderId,
        status: 'delivered',
        cod_auto_paid: codAutoPaid,
        bill_id: order.bill_id || null,
      },
    };
  }

  async delete(id) {
    return this.orderRepository.delete(id);
  }
}

module.exports = OrderService;
