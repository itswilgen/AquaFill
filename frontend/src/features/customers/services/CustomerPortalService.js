import { toAppError } from '../../../core/errors/AppError';

export default class CustomerPortalService {
  constructor({ orderService }) {
    this.orderService = orderService;
  }

  async getOrdersForSessionUser() {
    try {
      const ordersRes = await this.orderService.getMyOrders();
      return ordersRes?.data?.data || [];
    } catch (err) {
      throw toAppError(err, 'Failed to load customer orders');
    }
  }
}
