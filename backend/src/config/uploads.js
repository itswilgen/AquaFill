const path = require('path');

const backendRootDir = path.resolve(__dirname, '../..');
const defaultUploadsRootDir = path.join(backendRootDir, 'uploads');

const uploadsRootDir = process.env.UPLOADS_DIR
  ? path.resolve(process.env.UPLOADS_DIR)
  : defaultUploadsRootDir;

const paymentProofsDir = path.join(uploadsRootDir, 'payment-proofs');

// Backward-compatible fallback for setups that previously wrote to project-root ./uploads
const legacyUploadsRootDir = path.resolve(backendRootDir, '..', 'uploads');

const uploadsPublicBasePath = '/uploads';
const paymentProofPublicBasePath = `${uploadsPublicBasePath}/payment-proofs`;

module.exports = {
  uploadsRootDir,
  paymentProofsDir,
  legacyUploadsRootDir,
  uploadsPublicBasePath,
  paymentProofPublicBasePath,
};
