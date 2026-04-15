const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

const errorHandler = require('./middlewares/errorHandler');
const notFound = require('./middlewares/notFound');

dotenv.config();
const { services } = require('./container');
require('./db/connection');

services.billingService.ensurePaymentProofTable().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to initialize payment_proofs table:', err.message);
});

const app = express();

app.use(cors());
app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf.toString('utf8');
  },
}));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Fix Google popup CORS policy
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  next();
});

app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/inventory', require('./routes/inventoryRoutes'));
app.use('/api/billing', require('./routes/billingRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));

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
