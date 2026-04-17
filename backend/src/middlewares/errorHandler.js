const AppError = require('../core/AppError');

function errorHandler(err, req, res, next) {
  if (err?.name === 'MulterError' && err?.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      message: 'Uploaded screenshot is too large. Please use an image below 5MB.',
    });
  }

  if (err?.name === 'MulterError') {
    return res.status(400).json({
      success: false,
      message: err.message || 'Invalid file upload.',
    });
  }

  if (err?.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      message: 'Request payload is too large.',
    });
  }

  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ success: false, message: 'Invalid JSON payload.' });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.details ? { details: err.details } : {}),
      ...(err.code ? { code: err.code } : {}),
    });
  }

  const isProduction = String(process.env.NODE_ENV || '').toLowerCase() === 'production';

  // eslint-disable-next-line no-console
  console.error('[UnhandledError]', err);

  return res.status(500).json({
    success: false,
    message: isProduction ? 'Internal server error' : (err?.message || 'Internal server error'),
    ...(isProduction ? {} : { code: 'UNHANDLED_ERROR' }),
  });
}

module.exports = errorHandler;
