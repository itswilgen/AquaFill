const fs = require('fs/promises');
const path = require('path');
const AppError = require('../core/AppError');

const ALLOWED_IMAGE_MIME = {
  'image/jpg': 'jpg',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const MAX_PROOF_SIZE_BYTES = 5 * 1024 * 1024;

class PaymentProofStorageService {
  constructor({ uploadsDir = path.join(__dirname, '../../uploads/payment-proofs') } = {}) {
    this.uploadsDir = uploadsDir;
  }

  sanitizeText(value, maxLength = 120) {
    return String(value || '').trim().slice(0, maxLength);
  }

  parseDataUrlImage(dataUrl) {
    const value = String(dataUrl || '').trim();
    const match = value.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (!match) return null;

    const mimeType = match[1].toLowerCase();
    const extension = ALLOWED_IMAGE_MIME[mimeType];
    if (!extension) return null;

    const buffer = Buffer.from(match[2], 'base64');
    if (!buffer || buffer.length === 0) return null;

    if (buffer.length > MAX_PROOF_SIZE_BYTES) {
      throw new AppError('Proof screenshot is too large. Max size is 5MB.', 400, 'VALIDATION_ERROR');
    }

    return { buffer, extension };
  }

  parseUploadedFile(file) {
    if (!file || !Buffer.isBuffer(file.buffer) || file.buffer.length === 0) {
      return null;
    }

    const mimeType = String(file.mimetype || '').toLowerCase();
    const extension = ALLOWED_IMAGE_MIME[mimeType];
    if (!extension) return null;

    if (file.buffer.length > MAX_PROOF_SIZE_BYTES) {
      throw new AppError('Proof screenshot is too large. Max size is 5MB.', 400, 'VALIDATION_ERROR');
    }

    return {
      buffer: file.buffer,
      extension,
      originalName: file.originalname,
    };
  }

  buildProofFilename({ billId, extension, originalName }) {
    const timestamp = Date.now();
    const cleanedOriginal = this.sanitizeText(originalName, 80)
      .replace(/[^a-zA-Z0-9._-]/g, '-')
      .replace(/\.+/g, '.');

    const base = cleanedOriginal
      ? cleanedOriginal.replace(/\.[^.]+$/, '')
      : `bill-${billId}-proof`;

    return `${base}-${billId}-${timestamp}.${extension}`;
  }

  async saveProofImage({ billId, proofImage, proofFilename }) {
    const parsed = this.parseDataUrlImage(proofImage);
    if (!parsed) {
      throw new AppError('Invalid proof screenshot. Please upload a JPG, PNG, or WEBP image.', 400, 'VALIDATION_ERROR');
    }

    await fs.mkdir(this.uploadsDir, { recursive: true });

    const fileName = this.buildProofFilename({
      billId,
      extension: parsed.extension,
      originalName: proofFilename,
    });

    const absolutePath = path.join(this.uploadsDir, fileName);
    await fs.writeFile(absolutePath, parsed.buffer);

    return `/uploads/payment-proofs/${fileName}`;
  }

  async saveUploadedFile({ billId, file }) {
    const parsed = this.parseUploadedFile(file);
    if (!parsed) {
      throw new AppError('Invalid proof screenshot. Please upload a JPG, PNG, or WEBP image.', 400, 'VALIDATION_ERROR');
    }

    await fs.mkdir(this.uploadsDir, { recursive: true });

    const fileName = this.buildProofFilename({
      billId,
      extension: parsed.extension,
      originalName: parsed.originalName,
    });

    const absolutePath = path.join(this.uploadsDir, fileName);
    await fs.writeFile(absolutePath, parsed.buffer);

    return `/uploads/payment-proofs/${fileName}`;
  }
}

module.exports = PaymentProofStorageService;
