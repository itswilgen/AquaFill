import axios from 'axios';

// Base URL of your backend — all requests go here
const API = axios.create({
  baseURL: 'http://localhost:3001/api',
});

// Automatically attach the login token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Customers ──────────────────────────────────────
export const getCustomers    = ()       => API.get('/customers');
export const getCustomer     = (id)     => API.get(`/customers/${id}`);
export const searchCustomers = (q)      => API.get(`/customers/search?q=${q}`);
export const createCustomer  = (data)   => API.post('/customers', data);
export const updateCustomer  = (id, data) => API.put(`/customers/${id}`, data);
export const deleteCustomer  = (id)     => API.delete(`/customers/${id}`);
export const googleAuth = (data) => API.post('/auth/google', data);

// ── Orders ─────────────────────────────────────────
export const getOrders      = ()        => API.get('/orders');
export const createOrder    = (data)    => API.post('/orders', data);
export const updateOrderStatus = (id, status) => API.put(`/orders/${id}/status`, { status });
export const getRiderOrders = ()        => API.get('/orders/rider/queue');
export const confirmRiderDelivery = (id, data = {}) => API.put(`/orders/${id}/rider-confirm`, data);
export const deleteOrder    = (id)      => API.delete(`/orders/${id}`);

// ── Inventory ──────────────────────────────────────
export const getInventory   = ()        => API.get('/inventory');
export const getLowStock    = ()        => API.get('/inventory/lowstock');
export const createItem     = (data)    => API.post('/inventory', data);
export const updateItem     = (id, data) => API.put(`/inventory/${id}`, data);
export const deleteItem     = (id)      => API.delete(`/inventory/${id}`);

// ── Billing ────────────────────────────────────────
export const getBills       = ()        => API.get('/billing');
export const getBillSummary = ()        => API.get('/billing/summary');
export const markBillPaid   = (id)      => API.put(`/billing/${id}/pay`);
export const deleteBill     = (id)      => API.delete(`/billing/${id}`);

// ── Auth ───────────────────────────────────────────
export const login          = (data)    => API.post('/auth/login', data);
export const register       = (data)    => API.post('/auth/register', data);

// ── Customer portal ────────────────────────────────────────
export const getCustomerByEmail    = (email)  => API.get(`/customers/search?q=${email}`);
export const getOrdersByCustomer   = (id)     => API.get(`/orders/customer/${id}`);
export const createCustomerOrder   = (data)   => API.post('/orders', data);
export const getInventoryItems     = ()       => API.get('/inventory');
export const payBill               = (id, data = {}) => API.put(`/billing/${id}/pay`, data);
