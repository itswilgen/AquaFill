const UserRepository = require('./repositories/UserRepository');
const CustomerRepository = require('./repositories/CustomerRepository');
const InventoryRepository = require('./repositories/InventoryRepository');
const OrderRepository = require('./repositories/OrderRepository');
const BillRepository = require('./repositories/BillRepository');
const PaymentProofRepository = require('./repositories/PaymentProofRepository');

const AuthService = require('./services/AuthService');
const CustomerService = require('./services/CustomerService');
const InventoryService = require('./services/InventoryService');
const OrderService = require('./services/OrderService');
const BillingService = require('./services/BillingService');
const PaymentProofStorageService = require('./services/PaymentProofStorageService');
const FirebaseTokenVerifier = require('./services/FirebaseTokenVerifier');

const AuthController = require('./controllers/authController');
const CustomerController = require('./controllers/customerController');
const InventoryController = require('./controllers/inventoryController');
const OrderController = require('./controllers/orderController');
const BillingController = require('./controllers/billingController');

const userRepository = new UserRepository();
const customerRepository = new CustomerRepository();
const inventoryRepository = new InventoryRepository();
const orderRepository = new OrderRepository();
const billRepository = new BillRepository();
const paymentProofRepository = new PaymentProofRepository();

const paymentProofStorageService = new PaymentProofStorageService();

const firebaseTokenVerifier = new FirebaseTokenVerifier({
  projectId: process.env.FIREBASE_PROJECT_ID,
});

const authService = new AuthService({
  userRepository,
  customerRepository,
  jwtSecret: process.env.JWT_SECRET,
  firebaseTokenVerifier,
});

const customerService = new CustomerService({ customerRepository });
const inventoryService = new InventoryService({ inventoryRepository });
const orderService = new OrderService({
  orderRepository,
  billRepository,
  paymentProofRepository,
  inventoryRepository,
});
const billingService = new BillingService({
  billRepository,
  paymentProofRepository,
  paymentProofStorageService,
});

const authController = new AuthController({ authService });
const customerController = new CustomerController({ customerService });
const inventoryController = new InventoryController({ inventoryService });
const orderController = new OrderController({ orderService });
const billingController = new BillingController({ billingService });

module.exports = {
  repositories: {
    userRepository,
    customerRepository,
    inventoryRepository,
    orderRepository,
    billRepository,
    paymentProofRepository,
  },
  services: {
    authService,
    customerService,
    inventoryService,
    orderService,
    billingService,
    paymentProofStorageService,
    firebaseTokenVerifier,
  },
  controllers: {
    authController,
    customerController,
    inventoryController,
    orderController,
    billingController,
  },
};
