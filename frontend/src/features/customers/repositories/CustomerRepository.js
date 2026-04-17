export default class CustomerRepository {
  constructor({ apiClient }) {
    this.apiClient = apiClient;
  }

  getAll() {
    return this.apiClient.get('/customers');
  }

  getMe() {
    return this.apiClient.get('/customers/me');
  }

  getById(id) {
    return this.apiClient.get(`/customers/${id}`);
  }

  search(q) {
    return this.apiClient.get(`/customers/search?q=${encodeURIComponent(q)}`);
  }

  create(payload) {
    return this.apiClient.post('/customers', payload);
  }

  update(id, payload) {
    return this.apiClient.put(`/customers/${id}`, payload);
  }

  updateMe(payload) {
    return this.apiClient.put('/customers/me', payload);
  }

  delete(id) {
    return this.apiClient.delete(`/customers/${id}`);
  }
}
