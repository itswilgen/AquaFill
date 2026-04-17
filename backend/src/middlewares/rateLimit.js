const AppError = require('../core/AppError');

function createRateLimiter({
  windowMs = 15 * 60 * 1000,
  max = 100,
  keyGenerator = (req) => req.ip || 'unknown',
  message = 'Too many requests. Please try again later.',
  code = 'RATE_LIMITED',
} = {}) {
  const hits = new Map();

  return function rateLimiter(req, res, next) {
    const now = Date.now();
    const key = String(keyGenerator(req) || 'unknown');
    const current = hits.get(key);

    if (!current || current.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
    } else {
      current.count += 1;
      hits.set(key, current);
    }

    const entry = hits.get(key);
    const remaining = Math.max(max - entry.count, 0);
    const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);

    res.setHeader('X-RateLimit-Limit', String(max));
    res.setHeader('X-RateLimit-Remaining', String(remaining));
    res.setHeader('X-RateLimit-Reset', String(Math.floor(entry.resetAt / 1000)));

    if (entry.count > max) {
      res.setHeader('Retry-After', String(Math.max(retryAfterSeconds, 1)));
      return next(new AppError(message, 429, code, {
        retryAfterSeconds: Math.max(retryAfterSeconds, 1),
      }));
    }

    // Lightweight cleanup to avoid unbounded memory growth.
    if (hits.size > 10000) {
      for (const [storedKey, value] of hits.entries()) {
        if (value.resetAt <= now) hits.delete(storedKey);
      }
    }

    return next();
  };
}

module.exports = {
  createRateLimiter,
};
