const express = require('express');
const cors    = require('cors');
const dotenv  = require('dotenv');
const path = require('path');
const PaymentProof = require('./models/PaymentProof');

dotenv.config();
require('./db/connection');
PaymentProof.ensureTable().catch((err) => {
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
app.use('/api/orders',    require('./routes/orderRoutes'));
app.use('/api/inventory', require('./routes/inventoryRoutes'));
app.use('/api/billing',   require('./routes/billingRoutes'));
app.use('/api/auth',      require('./routes/authRoutes'));

app.get('/', (req, res) => {
  res.json({ message: 'Water Refilling System API is running!' });
});

app.use((err, req, res, next) => {
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      message: 'Uploaded screenshot is too large. Please use an image below 5MB.',
    });
  }

  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ success: false, message: 'Invalid JSON payload.' });
  }

  return next(err);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
