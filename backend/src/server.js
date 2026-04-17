const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

const errorHandler = require('./middlewares/errorHandler');
const notFound = require('./middlewares/notFound');
const AppError = require('./core/AppError');
const securityHeaders = require('./middlewares/securityHeaders');
const { createRateLimiter } = require('./middlewares/rateLimit');
const { createAuthenticate } = require('./middlewares/authenticate');

dotenv.config();
const { repositories, services } = require('./container');
require('./db/connection');

services.authService.ensureSchema().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to initialize auth security schema:', err.message);
});

services.billingService.ensurePaymentProofTable().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to initialize payment_proofs table:', err.message);
});

services.orderService.ensureSchema().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to initialize orders schema:', err.message);
});

const app = express();

if (String(process.env.TRUST_PROXY || '').toLowerCase() === 'true') {
  app.set('trust proxy', 1);
}

app.disable('x-powered-by');

const configuredOrigins = [
  process.env.CORS_ORIGIN,
  process.env.CORS_ORIGINS,
  process.env.FRONTEND_URL,
]
  .filter(Boolean)
  .flatMap((entry) => String(entry).split(','))
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOriginSet = new Set(configuredOrigins);
const localhostPattern = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;

const corsOptions = {
  origin(origin, callback) {
    if (!origin) {
      callback(null, true);
      return;
    }

    if (localhostPattern.test(origin) || allowedOriginSet.has(origin)) {
      callback(null, true);
      return;
    }

    callback(new AppError('Origin not allowed by CORS policy', 403, 'CORS_NOT_ALLOWED'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
};

app.use(securityHeaders);
app.use(cors(corsOptions));

app.use(createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 400,
  message: 'Too many requests from this IP. Please try again later.',
  code: 'GLOBAL_RATE_LIMITED',
}));

app.use(express.json({
  limit: '2mb',
  verify: (req, res, buf) => {
    req.rawBody = buf.toString('utf8');
  },
}));

app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
  dotfiles: 'deny',
  index: false,
  maxAge: '1h',
  setHeaders(res) {
    res.setHeader('Cache-Control', 'private, max-age=3600');
  },
}));

const authenticate = createAuthenticate({
  userRepository: repositories.userRepository,
  jwtSecret: process.env.JWT_SECRET,
});

const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  keyGenerator: (req) => req.ip || 'unknown',
  message: 'Too many authentication attempts. Please wait and try again.',
  code: 'AUTH_RATE_LIMITED',
});

app.use('/api/auth', authRateLimiter, require('./routes/authRoutes'));

app.use('/api/customers', authenticate, require('./routes/customerRoutes'));
app.use('/api/orders', authenticate, require('./routes/orderRoutes'));
app.use('/api/inventory', authenticate, require('./routes/inventoryRoutes'));
app.use('/api/billing', authenticate, require('./routes/billingRoutes'));

app.get('/', (req, res) => {
  res.json({ message: 'Water Refilling System API is running!' });
});

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running on port ${PORT}`);
});
