import { toAppError } from '../../../core/errors/AppError';

export default class OrderService {
  constructor({ orderRepository }) {
    this.orderRepository = orderRepository;
  }

  async getOrders() {
    try {
      return await this.orderRepository.getAll();
    } catch (err) {
      throw toAppError(err, 'Failed to load orders');
    }
  }

  async createOrder(payload) {
    try {
      return await this.orderRepository.create(payload);
    } catch (err) {
      throw toAppError(err, 'Failed to create order');
    }
  }

  async updateOrderStatus(id, status) {
    try {
      return await this.orderRepository.updateStatus(id, status);
    } catch (err) {
      throw toAppError(err, 'Failed to update order status');
    }
  }

  async getRiderOrders() {
    try {
      return await this.orderRepository.getRiderQueue();
    } catch (err) {
      throw toAppError(err, 'Failed to load rider queue');
    }
  }

  async confirmRiderDelivery(id, payload = {}) {
    try {
      return await this.orderRepository.riderConfirmDelivery(id, payload);
    } catch (err) {
      throw toAppError(err, 'Failed to confirm delivery');
    }
  }

  async deleteOrder(id) {
    try {
      return await this.orderRepository.delete(id);
    } catch (err) {
      throw toAppError(err, 'Failed to delete order');
    }
  }

  async getOrdersByCustomer(customerId) {
    try {
      return await this.orderRepository.getByCustomer(customerId);
    } catch (err) {
      throw toAppError(err, 'Failed to load customer orders');
    }
  }
}
