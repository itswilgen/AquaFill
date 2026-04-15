import { getServices } from '../app/container';

const {
  authService,
  customerService,
  orderService,
  inventoryService,
  billingService,
} = getServices();

// ── Customers ──────────────────────────────────────
export const getCustomers = () => customerService.getCustomers();
export const getCustomer = (id) => customerService.getCustomer(id);
export const searchCustomers = (q) => customerService.searchCustomers(q);
export const createCustomer = (data) => customerService.createCustomer(data);
export const updateCustomer = (id, data) => customerService.updateCustomer(id, data);
export const deleteCustomer = (id) => customerService.deleteCustomer(id);
export const googleAuth = (data) => authService.googleLogin(data);

// ── Orders ─────────────────────────────────────────
export const getOrders = () => orderService.getOrders();
export const createOrder = (data) => orderService.createOrder(data);
export const updateOrderStatus = (id, status) => orderService.updateOrderStatus(id, status);
export const getRiderOrders = () => orderService.getRiderOrders();
export const confirmRiderDelivery = (id, data = {}) => orderService.confirmRiderDelivery(id, data);
export const deleteOrder = (id) => orderService.deleteOrder(id);

// ── Inventory ──────────────────────────────────────
export const getInventory = () => inventoryService.getInventory();
export const getLowStock = () => inventoryService.getLowStock();
export const createItem = (data) => inventoryService.createItem(data);
export const updateItem = (id, data) => inventoryService.updateItem(id, data);
export const deleteItem = (id) => inventoryService.deleteItem(id);

// ── Billing ────────────────────────────────────────
export const getBills = () => billingService.getBills();
export const getBillSummary = () => billingService.getBillSummary();
export const markBillPaid = (id, data = {}) => billingService.markBillPaid(id, data);
export const deleteBill = (id) => billingService.deleteBill(id);

// ── Auth ───────────────────────────────────────────
export const login = (data) => authService.login(data);
export const register = (data) => authService.register(data);

// ── Customer portal ────────────────────────────────────────
export const getCustomerByEmail = (email) => customerService.searchCustomers(email);
export const getOrdersByCustomer = (id) => orderService.getOrdersByCustomer(id);
export const createCustomerOrder = (data) => orderService.createOrder(data);
export const getInventoryItems = () => inventoryService.getInventory();
export const payBill = (id, data = {}) => billingService.markBillPaid(id, data);
