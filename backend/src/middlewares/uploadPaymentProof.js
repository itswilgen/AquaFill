const multer = require('multer');
const AppError = require('../core/AppError');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (String(file?.mimetype || '').startsWith('image/')) {
      cb(null, true);
      return;
    }

    cb(new AppError('Please upload an image file (JPG, PNG, or WEBP).', 400, 'VALIDATION_ERROR'));
  },
});

module.exports = upload.single('proof_file');
