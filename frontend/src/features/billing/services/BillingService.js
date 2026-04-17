import { toAppError } from '../../../core/errors/AppError';

export default class BillingService {
  constructor({ billingRepository }) {
    this.billingRepository = billingRepository;
  }

  async getBills() {
    try {
      return await this.billingRepository.getAll();
    } catch (err) {
      throw toAppError(err, 'Failed to load bills');
    }
  }

  async getMyBills() {
    try {
      return await this.billingRepository.getMine();
    } catch (err) {
      throw toAppError(err, 'Failed to load your bills');
    }
  }

  async getBillSummary() {
    try {
      return await this.billingRepository.getSummary();
    } catch (err) {
      throw toAppError(err, 'Failed to load billing summary');
    }
  }

  async markBillPaid(id, payload = {}) {
    try {
      return await this.billingRepository.markPaid(id, payload);
    } catch (err) {
      throw toAppError(err, 'Failed to mark bill as paid');
    }
  }

  async deleteBill(id) {
    try {
      return await this.billingRepository.delete(id);
    } catch (err) {
      throw toAppError(err, 'Failed to delete bill');
    }
  }
}
