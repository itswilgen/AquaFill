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

  parseId(value, label = 'id') {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      throw new AppError(`Invalid ${label}`, 400, 'VALIDATION_ERROR');
    }
    return parsed;
  }

  validateReferenceNumber(referenceNo) {
    const value = this.sanitizeText(referenceNo, 120);
    if (!value) return '';

    if (!/^[a-zA-Z0-9._\-/]{4,120}$/.test(value)) {
      throw new AppError('Reference number format is invalid', 400, 'VALIDATION_ERROR');
    }

    return value;
  }

  requireCustomerId(user) {
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

  async ensurePaymentProofTable() {
    await this.paymentProofRepository.ensureTable();
  }

  async getAll() {
    return this.billRepository.getAll();
  }

  async getBySessionUser(user) {
    if (!user || String(user.role || '').toLowerCase() !== 'customer') {
      throw new AppError('Only customer accounts can access this route', 403, 'AUTH_FORBIDDEN');
    }

    const customerId = this.requireCustomerId(user);
    return this.billRepository.getByCustomerId(customerId);
  }

  async getSummary() {
    return this.billRepository.getSummary();
  }

  async markPaid(idValue, body, user) {
    const billId = this.parseId(idValue, 'bill id');

    const role = String(user?.role || '').toLowerCase();
    const isCustomer = role === 'customer';

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

    if (isCustomer) {
      const customerId = this.requireCustomerId(user);
      const context = await this.billRepository.getCheckoutContext(billId);

      if (!context || Number(context.customer_id) !== customerId) {
        throw new AppError('You can only pay your own bills', 403, 'AUTH_FORBIDDEN');
      }

      if (!paymentMethod) {
        throw new AppError('Payment method is required', 400, 'VALIDATION_ERROR');
      }

      if (!this.isOnlinePaymentMethod(paymentMethod)) {
        throw new AppError('Customers can only submit online payments', 400, 'VALIDATION_ERROR');
      }
    }

    const referenceNo = this.validateReferenceNumber(body?.reference_no);
    const payerName = this.sanitizeText(body?.payer_name, 120);
    const proofImage = body?.proof_image;
    const proofFilename = body?.proof_filename;
    const proofFile = body?.proof_file;

    const saveProof = async () => {
      if (proofFile) {
        return this.paymentProofStorageService.saveUploadedFile({
          billId,
          file: proofFile,
        });
      }

      return this.paymentProofStorageService.saveProofImage({
        billId,
        proofImage,
        proofFilename,
      });
    };

    if (paymentMethod && this.isOnlinePaymentMethod(paymentMethod)) {
      if (!referenceNo) {
        throw new AppError('Reference number is required.', 400, 'VALIDATION_ERROR');
      }
      if (!proofImage && !proofFile) {
        throw new AppError('Screenshot proof is required.', 400, 'VALIDATION_ERROR');
      }

      const proofUrl = await saveProof();

      await this.paymentProofRepository.saveForBill({
        billId,
        paymentMethod,
        referenceNo,
        payerName,
        proofUrl,
      });
    } else if (paymentMethod === 'cod') {
      await this.paymentProofRepository.saveForBill({
        billId,
        paymentMethod: 'cod',
        referenceNo: referenceNo || 'COD',
        payerName: payerName || 'Cash on Delivery',
        proofUrl: 'COD',
      });
    } else if (paymentMethod && (proofImage || proofFile)) {
      const proofUrl = await saveProof();

      await this.paymentProofRepository.saveForBill({
        billId,
        paymentMethod,
        referenceNo: referenceNo || 'N/A',
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
    const billId = this.parseId(id, 'bill id');
    return this.billRepository.delete(billId);
  }
}

module.exports = BillingService;
