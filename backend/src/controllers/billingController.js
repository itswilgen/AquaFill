const fs = require('fs');
const path = require('path');
const Bill = require('../models/Bill');
const PaymentProof = require('../models/PaymentProof');

const ONLINE_METHODS = ['gcash', 'maya', 'gotyme', 'bank'];
const PAYMENT_METHODS = [...ONLINE_METHODS, 'cod'];
const ALLOWED_IMAGE_MIME = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};
const MAX_PROOF_SIZE_BYTES = 5 * 1024 * 1024;

function sanitizeText(value, maxLength = 120) {
  return String(value || '').trim().slice(0, maxLength);
}

function parseDataUrlImage(dataUrl) {
  const value = String(dataUrl || '').trim();
  const match = value.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) return null;

  const mimeType = match[1].toLowerCase();
  const extension = ALLOWED_IMAGE_MIME[mimeType];
  if (!extension) return null;

  const buffer = Buffer.from(match[2], 'base64');
  if (!buffer || buffer.length === 0) return null;
  if (buffer.length > MAX_PROOF_SIZE_BYTES) {
    throw new Error('Proof screenshot is too large. Max size is 5MB.');
  }

  return { buffer, extension };
}

function buildProofFilename({ billId, extension, originalName }) {
  const timestamp = Date.now();
  const cleanedOriginal = sanitizeText(originalName, 80)
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/\.+/g, '.');
  const base = cleanedOriginal ? cleanedOriginal.replace(/\.[^.]+$/, '') : `bill-${billId}-proof`;
  return `${base}-${billId}-${timestamp}.${extension}`;
}

function saveProofImage({ billId, proofImage, proofFilename }) {
  const parsed = parseDataUrlImage(proofImage);
  if (!parsed) {
    throw new Error('Invalid proof screenshot. Please upload a JPG, PNG, or WEBP image.');
  }

  const uploadsDir = path.join(__dirname, '../../uploads/payment-proofs');
  fs.mkdirSync(uploadsDir, { recursive: true });

  const fileName = buildProofFilename({
    billId,
    extension: parsed.extension,
    originalName: proofFilename,
  });
  const absolutePath = path.join(uploadsDir, fileName);
  fs.writeFileSync(absolutePath, parsed.buffer);

  return `/uploads/payment-proofs/${fileName}`;
}

class BillingController {
  static isValidPaymentMethod(method) {
    return PAYMENT_METHODS.includes(String(method || '').toLowerCase());
  }

  static isOnlinePaymentMethod(method) {
    return ONLINE_METHODS.includes(String(method || '').toLowerCase());
  }

  static async getAll(req, res) {
    try {
      const bills = await Bill.getAll();
      res.json({ success: true, data: bills });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async markPaid(req, res) {
    try {
      const billId = Number.parseInt(req.params.id, 10);
      if (!Number.isInteger(billId) || billId <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid bill id' });
      }

      const paymentMethod = String(req.body?.payment_method || '').toLowerCase();
      if (paymentMethod && !BillingController.isValidPaymentMethod(paymentMethod)) {
        return res.status(400).json({ success: false, message: 'Invalid payment method' });
      }

      const bill = await Bill.getById(billId);
      if (!bill) {
        return res.status(404).json({ success: false, message: 'Bill not found' });
      }
      if (String(bill.status || '').toLowerCase() === 'paid') {
        return res.status(400).json({ success: false, message: 'Bill is already paid' });
      }

      const referenceNo = sanitizeText(req.body?.reference_no, 120);
      const payerName = sanitizeText(req.body?.payer_name, 120);
      const proofImage = req.body?.proof_image;
      const proofFilename = req.body?.proof_filename;

      if (paymentMethod && BillingController.isOnlinePaymentMethod(paymentMethod)) {
        if (!referenceNo) {
          return res.status(400).json({ success: false, message: 'Reference number is required.' });
        }
        if (!proofImage) {
          return res.status(400).json({ success: false, message: 'Screenshot proof is required.' });
        }

        const proofUrl = saveProofImage({
          billId,
          proofImage,
          proofFilename,
        });

        await PaymentProof.saveForBill({
          billId,
          paymentMethod,
          referenceNo,
          payerName,
          proofUrl,
        });
      } else if (paymentMethod && proofImage) {
        // Optional screenshot for COD if user sends one.
        const proofUrl = saveProofImage({
          billId,
          proofImage,
          proofFilename,
        });
        await PaymentProof.saveForBill({
          billId,
          paymentMethod,
          referenceNo: referenceNo || 'COD',
          payerName,
          proofUrl,
        });
      }

      await Bill.markPaid(billId);

      res.json({
        success: true,
        message: paymentMethod
          ? `Bill marked as paid via ${paymentMethod.toUpperCase()}`
          : 'Bill marked as paid',
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async delete(req, res) {
    try {
      await Bill.delete(req.params.id);
      res.json({ success: true, message: 'Bill deleted' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async getSummary(req, res) {
    try {
      const summary = await Bill.getSummary();
      res.json({ success: true, data: summary });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = BillingController;
