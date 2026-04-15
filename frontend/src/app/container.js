import ApiClient from '../core/http/ApiClient';
import AuthStore from '../core/storage/AuthStore';

import AuthRepository from '../features/auth/repositories/AuthRepository';
import CustomerRepository from '../features/customers/repositories/CustomerRepository';
import OrderRepository from '../features/orders/repositories/OrderRepository';
import InventoryRepository from '../features/inventory/repositories/InventoryRepository';
import BillingRepository from '../features/billing/repositories/BillingRepository';

import AuthService from '../features/auth/services/AuthService';
import CustomerService from '../features/customers/services/CustomerService';
import CustomerPortalService from '../features/customers/services/CustomerPortalService';
import OrderService from '../features/orders/services/OrderService';
import InventoryService from '../features/inventory/services/InventoryService';
import BillingService from '../features/billing/services/BillingService';

const authStore = new AuthStore();
const apiClient = new ApiClient({
  baseURL: 'http://localhost:3001/api',
  authStore,
});

const authRepository = new AuthRepository({ apiClient });
const customerRepository = new CustomerRepository({ apiClient });
const orderRepository = new OrderRepository({ apiClient });
const inventoryRepository = new InventoryRepository({ apiClient });
const billingRepository = new BillingRepository({ apiClient });

const authService = new AuthService({ authRepository, authStore });
const customerService = new CustomerService({ customerRepository });
const orderService = new OrderService({ orderRepository });
const customerPortalService = new CustomerPortalService({ customerService, orderService });
const inventoryService = new InventoryService({ inventoryRepository });
const billingService = new BillingService({ billingRepository });

export const appContainer = {
  core: {
    authStore,
    apiClient,
  },
  repositories: {
    authRepository,
    customerRepository,
    orderRepository,
    inventoryRepository,
    billingRepository,
  },
  services: {
    authService,
    customerService,
    customerPortalService,
    orderService,
    inventoryService,
    billingService,
  },
};

export function getServices() {
  return appContainer.services;
}

export function getAuthService() {
  return appContainer.services.authService;
}
