const PaymentProof = require('../models/PaymentProof');

class PaymentProofRepository {
  async ensureTable() {
    return PaymentProof.ensureTable();
  }

  async saveForBill({ billId, paymentMethod, referenceNo, payerName, proofUrl }) {
    return PaymentProof.saveForBill({
      billId,
      paymentMethod,
      referenceNo,
      payerName,
      proofUrl,
    });
  }
}

module.exports = PaymentProofRepository;
