import { toAppError } from '../../../core/errors/AppError';

export default class CustomerPortalService {
  constructor({ customerService, orderService }) {
    this.customerService = customerService;
    this.orderService = orderService;
  }

  async findCustomerBySessionUser(user) {
    const query = (user?.name || user?.username || '').trim();
    if (!query) return null;

    try {
      const res = await this.customerService.searchCustomers(query);
      const customers = res?.data?.data || [];
      return customers[0] || null;
    } catch (err) {
      throw toAppError(err, 'Failed to load customer profile');
    }
  }

  async getOrdersForSessionUser(user) {
    const customer = await this.findCustomerBySessionUser(user);
    if (!customer) return [];

    try {
      const ordersRes = await this.orderService.getOrdersByCustomer(customer.id);
      return ordersRes?.data?.data || [];
    } catch (err) {
      throw toAppError(err, 'Failed to load customer orders');
    }
  }
}
