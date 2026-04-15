export class AppError extends Error {
  constructor(message, code = 'APP_ERROR', status = 500, details = null) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export function toAppError(err, fallbackMessage = 'Unexpected error occurred') {
  const message = err?.response?.data?.message || err?.message || fallbackMessage;
  const code = err?.response?.data?.code || err?.code || 'APP_ERROR';
  const status = err?.response?.status || 500;
  const details = err?.response?.data?.details || null;
  return new AppError(message, code, status, details);
}
