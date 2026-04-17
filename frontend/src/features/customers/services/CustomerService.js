import { toAppError } from '../../../core/errors/AppError';

export default class CustomerService {
  constructor({ customerRepository }) {
    this.customerRepository = customerRepository;
  }

  async getCustomers() {
    try {
      return await this.customerRepository.getAll();
    } catch (err) {
      throw toAppError(err, 'Failed to load customers');
    }
  }

  async getMyProfile() {
    try {
      return await this.customerRepository.getMe();
    } catch (err) {
      throw toAppError(err, 'Failed to load customer profile');
    }
  }

  async getCustomer(id) {
    try {
      return await this.customerRepository.getById(id);
    } catch (err) {
      throw toAppError(err, 'Failed to load customer');
    }
  }

  async searchCustomers(query) {
    try {
      return await this.customerRepository.search(query);
    } catch (err) {
      throw toAppError(err, 'Failed to search customers');
    }
  }

  async createCustomer(payload) {
    try {
      return await this.customerRepository.create(payload);
    } catch (err) {
      throw toAppError(err, 'Failed to create customer');
    }
  }

  async updateCustomer(id, payload) {
    try {
      return await this.customerRepository.update(id, payload);
    } catch (err) {
      throw toAppError(err, 'Failed to update customer');
    }
  }

  async updateMyProfile(payload) {
    try {
      return await this.customerRepository.updateMe(payload);
    } catch (err) {
      throw toAppError(err, 'Failed to update customer profile');
    }
  }

  async deleteCustomer(id) {
    try {
      return await this.customerRepository.delete(id);
    } catch (err) {
      throw toAppError(err, 'Failed to delete customer');
    }
  }
}
