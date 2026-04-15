export default class InventoryRepository {
  constructor({ apiClient }) {
    this.apiClient = apiClient;
  }

  getAll() {
    return this.apiClient.get('/inventory');
  }

  getLowStock() {
    return this.apiClient.get('/inventory/lowstock');
  }

  create(payload) {
    return this.apiClient.post('/inventory', payload);
  }

  update(id, payload) {
    return this.apiClient.put(`/inventory/${id}`, payload);
  }

  delete(id) {
    return this.apiClient.delete(`/inventory/${id}`);
  }
}
