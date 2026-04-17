const AppError = require('../core/AppError');

const ORDER_STATUSES = ['pending', 'delivered', 'cancelled'];

class OrderService {
  constructor({
    orderRepository,
    billRepository,
    paymentProofRepository,
    inventoryRepository,
    customerRepository,
  }) {
    this.orderRepository = orderRepository;
    this.billRepository = billRepository;
    this.paymentProofRepository = paymentProofRepository;
    this.inventoryRepository = inventoryRepository;
    this.customerRepository = customerRepository;
  }

  async ensureSchema() {
    await this.orderRepository.ensureItemColumn();
  }

  parseId(value, label = 'id') {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      throw new AppError(`Invalid ${label}`, 400, 'VALIDATION_ERROR');
    }
    return parsed;
  }

  parseQuantity(value) {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 100) {
      throw new AppError('Quantity must be an integer between 1 and 100', 400, 'VALIDATION_ERROR');
    }
    return parsed;
  }

  parseAmount(value) {
    if (value === undefined || value === null || value === '') return null;

    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      throw new AppError('Amount must be greater than zero', 400, 'VALIDATION_ERROR');
    }

    return Number(parsed.toFixed(2));
  }

  parseDeliveryDate(value) {
    const raw = String(value || '').trim();
    if (!raw) return null;

    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) {
      throw new AppError('Invalid delivery date', 400, 'VALIDATION_ERROR');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const selected = new Date(parsed);
    selected.setHours(0, 0, 0, 0);

    if (selected < today) {
      throw new AppError('Delivery date cannot be in the past', 400, 'VALIDATION_ERROR');
    }

    return raw.slice(0, 10);
  }

  resolveServerPrice(itemName, quantity) {
    const label = String(itemName || '').toLowerCase();

    if (label.includes('gallon')) return Number((50 * quantity).toFixed(2));
    if (label.includes('1l') || label.includes('1 liter')) return Number((25 * quantity).toFixed(2));
    if (label.includes('500')) return Number((15 * quantity).toFixed(2));

    return null;
  }

  requireCustomerIdFromUser(user) {
    const customerId = Number.parseInt(user?.customer_id, 10);
    if (!Number.isInteger(customerId) || customerId <= 0) {
      throw new AppError(
        'Customer account is missing a customer profile link. Please contact support.',
        403,
        'CUSTOMER_LINK_REQUIRED'
      );
    }
    return customerId;
  }

  async ensureCustomerHasDeliveryAddress(customerId) {
    const customer = await this.customerRepository.getById(customerId);
    if (!customer) {
      throw new AppError('Customer profile not found for this account', 404, 'CUSTOMER_NOT_FOUND');
    }

    const address = String(customer.address || '').trim();
    if (!address || address.length < 10) {
      throw new AppError(
        'Please add your complete delivery address in your profile before placing an order.',
        400,
        'CUSTOMER_ADDRESS_REQUIRED'
      );
    }
  }

  async getForRider() {
    return this.orderRepository.getForRiderQueue();
  }

  async getByCustomer(customerIdValue, user = null) {
    const customerId = this.parseId(customerIdValue, 'customer id');

    if (user && String(user.role || '').toLowerCase() === 'customer') {
      const sessionCustomerId = this.requireCustomerIdFromUser(user);
      if (sessionCustomerId !== customerId) {
        throw new AppError('You can only access your own orders', 403, 'AUTH_FORBIDDEN');
      }
    }

    return this.orderRepository.getByCustomerId(customerId);
  }

  async getBySessionUser(user) {
    if (!user || String(user.role || '').toLowerCase() !== 'customer') {
      throw new AppError('Only customer accounts can access this route', 403, 'AUTH_FORBIDDEN');
    }

    return this.orderRepository.getByUserId(user.id);
  }

  async getAll() {
    return this.orderRepository.getAll();
  }

  async getById(id) {
    const orderId = this.parseId(id, 'order id');
    const order = await this.orderRepository.getById(orderId);
    if (!order) {
      throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
    }

    return order;
  }

  async create(payload, user) {
    const parsedQuantity = this.parseQuantity(payload?.quantity);
    const parsedItemId = this.parseId(payload?.item_id, 'item id');
    const deliveryDate = this.parseDeliveryDate(payload?.delivery_date);

    const item = await this.inventoryRepository.getById(parsedItemId);
    if (!item) {
      throw new AppError('Selected product was not found', 404, 'PRODUCT_NOT_FOUND');
    }

    const requiresStockCheck = !this.isRefillItem(item.item_name);
    if (requiresStockCheck && parsedQuantity > Number(item.quantity || 0)) {
      throw new AppError('Requested quantity exceeds available stock', 400, 'INSUFFICIENT_STOCK');
    }

    const role = String(user?.role || '').toLowerCase();
    const serverPrice = this.resolveServerPrice(item.item_name, parsedQuantity);
    const requestedAmount = this.parseAmount(payload?.amount);

    let customerId;
    let finalAmount;

    if (role === 'customer') {
      customerId = this.requireCustomerIdFromUser(user);
      await this.ensureCustomerHasDeliveryAddress(customerId);

      if (serverPrice === null) {
        throw new AppError(
          'This product does not have a configured customer price. Please contact support.',
          400,
          'PRICE_NOT_CONFIGURED'
        );
      }

      finalAmount = serverPrice;
    } else {
      customerId = this.parseId(payload?.customer_id, 'customer id');
      finalAmount = requestedAmount ?? serverPrice;

      if (!Number.isFinite(finalAmount) || finalAmount <= 0) {
        throw new AppError('Amount must be greater than zero', 400, 'VALIDATION_ERROR');
      }
    }

    const orderId = await this.orderRepository.create({
      customer_id: customerId,
      item_id: parsedItemId,
      quantity: parsedQuantity,
      delivery_date: deliveryDate,
    });

    await this.billRepository.create({
      order_id: orderId,
      amount: finalAmount,
    });

    return orderId;
  }

  async updateStatus(id, statusValue) {
    const orderId = this.parseId(id, 'order id');
    const status = String(statusValue || '').toLowerCase();

    if (!ORDER_STATUSES.includes(status)) {
      throw new AppError(`Status must be one of: ${ORDER_STATUSES.join(', ')}`, 400, 'VALIDATION_ERROR');
    }

    await this.orderRepository.updateStatus(orderId, status);
  }

  async riderConfirmDelivery(orderIdValue, codPaidValue) {
    const orderId = this.parseId(orderIdValue, 'order id');

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
    const orderId = this.parseId(id, 'order id');
    return this.orderRepository.delete(orderId);
  }

  isRefillItem(itemName) {
    const label = String(itemName || '').toLowerCase();
    return label.includes('gallon');
  }
}

module.exports = OrderService;
