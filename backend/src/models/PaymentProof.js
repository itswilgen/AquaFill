const db = require('../db/connection');

class PaymentProof {
  static async ensureTable() {
    await db.query(`
      CREATE TABLE IF NOT EXISTS payment_proofs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        bill_id INT NOT NULL UNIQUE,
        payment_method VARCHAR(32) NOT NULL,
        reference_no VARCHAR(120) NULL,
        payer_name VARCHAR(120) NULL,
        proof_url VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_payment_proofs_bill
          FOREIGN KEY (bill_id) REFERENCES bills(id)
          ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
  }

  static async saveForBill({ billId, paymentMethod, referenceNo, payerName, proofUrl }) {
    await PaymentProof.ensureTable();
    await db.query(
      `
        INSERT INTO payment_proofs (bill_id, payment_method, reference_no, payer_name, proof_url)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          payment_method = VALUES(payment_method),
          reference_no = VALUES(reference_no),
          payer_name = VALUES(payer_name),
          proof_url = VALUES(proof_url)
      `,
      [billId, paymentMethod, referenceNo || null, payerName || null, proofUrl]
    );
  }
}

module.exports = PaymentProof;
