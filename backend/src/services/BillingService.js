const AppError = require('../core/AppError');

const ONLINE_METHODS = ['gcash', 'maya', 'gotyme', 'bank'];
const PAYMENT_METHODS = [...ONLINE_METHODS, 'cod'];

class BillingService {
  constructor({ billRepository, paymentProofRepository, paymentProofStorageService }) {
    this.billRepository = billRepository;
    this.paymentProofRepository = paymentProofRepository;
    this.paymentProofStorageService = paymentProofStorageService;
  }

  isValidPaymentMethod(method) {
    return PAYMENT_METHODS.includes(String(method || '').toLowerCase());
  }

  isOnlinePaymentMethod(method) {
    return ONLINE_METHODS.includes(String(method || '').toLowerCase());
  }

  sanitizeText(value, maxLength = 120) {
    return String(value || '').trim().slice(0, maxLength);
  }

  async ensurePaymentProofTable() {
    await this.paymentProofRepository.ensureTable();
  }

  async getAll() {
    return this.billRepository.getAll();
  }

  async getSummary() {
    return this.billRepository.getSummary();
  }

  async markPaid(idValue, body) {
    const billId = Number.parseInt(idValue, 10);
    if (!Number.isInteger(billId) || billId <= 0) {
      throw new AppError('Invalid bill id', 400, 'VALIDATION_ERROR');
    }

    const paymentMethod = String(body?.payment_method || '').toLowerCase();
    if (paymentMethod && !this.isValidPaymentMethod(paymentMethod)) {
      throw new AppError('Invalid payment method', 400, 'VALIDATION_ERROR');
    }

    const bill = await this.billRepository.getById(billId);
    if (!bill) {
      throw new AppError('Bill not found', 404, 'BILL_NOT_FOUND');
    }

    if (String(bill.status || '').toLowerCase() === 'paid') {
      throw new AppError('Bill is already paid', 400, 'BILL_ALREADY_PAID');
    }

    const referenceNo = this.sanitizeText(body?.reference_no, 120);
    const payerName = this.sanitizeText(body?.payer_name, 120);
    const proofImage = body?.proof_image;
    const proofFilename = body?.proof_filename;

    if (paymentMethod && this.isOnlinePaymentMethod(paymentMethod)) {
      if (!referenceNo) {
        throw new AppError('Reference number is required.', 400, 'VALIDATION_ERROR');
      }
      if (!proofImage) {
        throw new AppError('Screenshot proof is required.', 400, 'VALIDATION_ERROR');
      }

      const proofUrl = await this.paymentProofStorageService.saveProofImage({
        billId,
        proofImage,
        proofFilename,
      });

      await this.paymentProofRepository.saveForBill({
        billId,
        paymentMethod,
        referenceNo,
        payerName,
        proofUrl,
      });
    } else if (paymentMethod && proofImage) {
      const proofUrl = await this.paymentProofStorageService.saveProofImage({
        billId,
        proofImage,
        proofFilename,
      });

      await this.paymentProofRepository.saveForBill({
        billId,
        paymentMethod,
        referenceNo: referenceNo || 'COD',
        payerName,
        proofUrl,
      });
    }

    await this.billRepository.markPaid(billId);

    return {
      message: paymentMethod
        ? `Bill marked as paid via ${paymentMethod.toUpperCase()}`
        : 'Bill marked as paid',
    };
  }

  async delete(id) {
    return this.billRepository.delete(id);
  }
}

module.exports = BillingService;
