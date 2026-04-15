export default class OrderRepository {
  constructor({ apiClient }) {
    this.apiClient = apiClient;
  }

  getAll() {
    return this.apiClient.get('/orders');
  }

  create(payload) {
    return this.apiClient.post('/orders', payload);
  }

  updateStatus(id, status) {
    return this.apiClient.put(`/orders/${id}/status`, { status });
  }

  getRiderQueue() {
    return this.apiClient.get('/orders/rider/queue');
  }

  riderConfirmDelivery(id, payload = {}) {
    return this.apiClient.put(`/orders/${id}/rider-confirm`, payload);
  }

  delete(id) {
    return this.apiClient.delete(`/orders/${id}`);
  }

  getByCustomer(customerId) {
    return this.apiClient.get(`/orders/customer/${customerId}`);
  }
}
