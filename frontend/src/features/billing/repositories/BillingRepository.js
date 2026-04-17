export default class BillingRepository {
  constructor({ apiClient }) {
    this.apiClient = apiClient;
  }

  getAll() {
    return this.apiClient.get('/billing');
  }

  getMine() {
    return this.apiClient.get('/billing/me');
  }

  getSummary() {
    return this.apiClient.get('/billing/summary');
  }

  markPaid(id, payload = {}) {
    return this.apiClient.put(`/billing/${id}/pay`, payload);
  }

  delete(id) {
    return this.apiClient.delete(`/billing/${id}`);
  }
}
