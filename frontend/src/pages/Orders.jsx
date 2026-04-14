import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import Spinner from '../components/Spinner';
import { Toast } from '../components/Toast';
import { useToast } from '../hooks/useToast';
import { useWindowSize } from '../hooks/useWindowSize';
import { createOrder, deleteOrder, getCustomers, getOrders, updateOrderStatus } from '../services/api';
import { StatusBadge } from './Dashboard';

const emptyForm = { customer_id: '', quantity: 1, delivery_date: '', amount: '' };
const statuses = ['pending', 'delivered', 'cancelled'];
const PAGE_SIZE = 10;

export default function Orders() {
  const { isMobile, isTablet, isNarrow } = useWindowSize();
  const [orders,    setOrders]    = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form,      setForm]      = useState(emptyForm);
  const { toast, showToast }      = useToast();
  const [animateIn, setAnimateIn] = useState(false);
  const [page, setPage] = useState(1);
  const showDateColumns = !isMobile;
  const contentPadding = isMobile ? 16 : isTablet ? 20 : 28;
  const totalPages = Math.max(1, Math.ceil(orders.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const pagedOrders = orders.slice(startIndex, startIndex + PAGE_SIZE);

  async function load({ silent = false } = {}) {
    if (!silent) setLoading(true);
    try {
      const [ordersRes, customersRes] = await Promise.all([getOrders(), getCustomers()]);
      setOrders(ordersRes.data.data || []);
      setCustomers(customersRes.data.data || []);
    } catch (error) {
      showToast(error?.response?.data?.message || 'Failed to load orders.', 'error');
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    void load();

    const intervalId = setInterval(() => {
      void load({ silent: true });
    }, 5000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setAnimateIn(true), 60);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    setPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  function openAdd() {
    setForm(emptyForm);
    setShowModal(true);
  }

  async function handleCreate() {
    const payload = {
      customer_id: Number(form.customer_id),
      quantity: Number(form.quantity),
      delivery_date: form.delivery_date || null,
      amount: Number(form.amount),
    };

    if (!payload.customer_id) {
      showToast('Please select a customer.', 'error');
      return;
    }

    if (payload.quantity < 1 || payload.amount <= 0) {
      showToast('Quantity and amount must be greater than zero.', 'error');
      return;
    }

    try {
      await createOrder(payload);
      showToast('Order created successfully.');
      setShowModal(false);
      await load();
    } catch (error) {
      showToast(error?.response?.data?.message || 'Failed to create order.', 'error');
    }
  }

  async function handleStatusChange(id, status) {
    try {
      await updateOrderStatus(id, status);
      showToast('Order status updated.');
      await load();
    } catch (error) {
      showToast(error?.response?.data?.message || 'Failed to update order.', 'error');
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this order?')) return;

    try {
      await deleteOrder(id);
      showToast('Order deleted.', 'info');
      await load();
    } catch (error) {
      showToast(error?.response?.data?.message || 'Failed to delete order.', 'error');
    }
  }

  return (
    <Layout>
      <style>{`
        @keyframes adminFadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes adminFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .admin-action-btn {
          transition: transform 0.18s ease, box-shadow 0.18s ease;
        }
        .admin-action-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 18px rgba(15, 23, 42, 0.14);
        }
        .admin-table-wrap {
          transition: box-shadow 0.2s ease, border-color 0.2s ease;
        }
        .admin-table-wrap:hover {
          border-color: #d8e2ec;
          box-shadow: 0 8px 20px rgba(15, 23, 42, 0.06);
        }
        .admin-row {
          transition: background 0.16s ease;
        }
        .admin-row:hover {
          background: #f8fafc;
        }
        @media (prefers-reduced-motion: reduce) {
          .admin-action-btn,
          .admin-table-wrap,
          .admin-row {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>

      <PageHeader title="Orders" subtitle="Track deliveries and update order statuses" />

      <div style={{ ...styles.content, padding: contentPadding }}>
        <div style={{ ...styles.toolbar, ...(animateIn ? { animation: 'adminFadeUp 0.42s ease both' } : {}) }}>
          <button
            className="admin-action-btn"
            style={{ ...styles.addBtn, width: isMobile ? '100%' : 'auto' }}
            onClick={openAdd}
          >
            + Add order
          </button>
        </div>

        {loading ? <Spinner /> : (
          <div
            className="admin-table-wrap"
            style={{ ...styles.tableWrap, ...(animateIn ? { animation: 'adminFadeUp 0.45s ease 0.08s both' } : {}) }}
          >
            <table style={{ ...styles.table, minWidth: showDateColumns ? 760 : (isNarrow ? 420 : 560) }}>
              <thead>
                <tr style={styles.thead}>
                  <th style={styles.th}>Order</th>
                  <th style={styles.th}>Customer</th>
                  <th style={styles.th}>Quantity</th>
                  <th style={styles.th}>Status</th>
                  {showDateColumns && <th style={styles.th}>Delivery date</th>}
                  {showDateColumns && <th style={styles.th}>Created</th>}
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={showDateColumns ? 7 : 5} style={styles.empty}>No orders found</td>
                  </tr>
                ) : pagedOrders.map((order, index) => (
                  <tr
                    key={order.id}
                    className="admin-row"
                    style={animateIn ? { animation: `adminFadeIn 0.32s ease ${0.12 + (index * 0.03)}s both` } : undefined}
                  >
                    <td style={styles.td}>#{order.id}</td>
                    <td style={styles.td}>{order.customer_name || `Customer #${order.customer_id}`}</td>
                    <td style={styles.td}>{order.quantity}</td>
                    <td style={styles.td}><StatusBadge status={order.status} /></td>
                    {showDateColumns && <td style={styles.td}>{order.delivery_date?.slice(0, 10) || '-'}</td>}
                    {showDateColumns && <td style={styles.td}>{order.created_at?.slice(0, 10) || '-'}</td>}
                    <td style={{ ...styles.td, ...styles.actionsCell, ...(isNarrow ? styles.actionsMobile : {}) }}>
                      <select
                        className="admin-action-btn"
                        style={{ ...styles.statusSelect, ...(isNarrow ? styles.statusSelectMobile : {}) }}
                        value={order.status || 'pending'}
                        onChange={e => handleStatusChange(order.id, e.target.value)}
                      >
                        {statuses.map(status => <option key={status} value={status}>{status}</option>)}
                      </select>
                      <button className="admin-action-btn" style={{ ...styles.deleteBtn, ...(isNarrow ? styles.actionBtnMobile : {}) }} onClick={() => handleDelete(order.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && orders.length > 0 && (
          <div style={styles.paginationWrap}>
            <div style={styles.paginationInfo}>
              Showing {startIndex + 1}-{Math.min(startIndex + PAGE_SIZE, orders.length)} of {orders.length}
            </div>
            <div style={styles.paginationControls}>
              <button
                type="button"
                style={{ ...styles.pageBtn, ...(currentPage === 1 ? styles.pageBtnDisabled : {}) }}
                disabled={currentPage === 1}
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              >
                Previous
              </button>
              <span style={styles.pageText}>Page {currentPage} of {totalPages}</span>
              <button
                type="button"
                style={{ ...styles.pageBtn, ...(currentPage === totalPages ? styles.pageBtnDisabled : {}) }}
                disabled={currentPage === totalPages}
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <Modal title="Add order" onClose={() => setShowModal(false)}>
          <label style={styles.label}>Customer *</label>
          <select
            style={styles.input}
            value={form.customer_id}
            onChange={e => setForm({ ...form, customer_id: e.target.value })}
          >
            <option value="">Choose a customer...</option>
            {customers.map(customer => (
              <option key={customer.id} value={customer.id}>{customer.name}</option>
            ))}
          </select>

          <label style={styles.label}>Quantity *</label>
          <input
            style={styles.input}
            type="number"
            min="1"
            value={form.quantity}
            onChange={e => setForm({ ...form, quantity: e.target.value })}
          />

          <label style={styles.label}>Amount *</label>
          <input
            style={styles.input}
            type="number"
            min="0"
            step="0.01"
            value={form.amount}
            onChange={e => setForm({ ...form, amount: e.target.value })}
            placeholder="0.00"
          />

          <label style={styles.label}>Delivery date</label>
          <input
            style={styles.input}
            type="date"
            value={form.delivery_date}
            onChange={e => setForm({ ...form, delivery_date: e.target.value })}
          />

          <div style={{ ...styles.modalActions, flexDirection: isMobile ? 'column' : 'row' }}>
            <button style={styles.saveBtn} onClick={handleCreate}>Save</button>
            <button style={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
          </div>
        </Modal>
      )}

      <Toast toast={toast} />
    </Layout>
  );
}

const styles = {
  content:      { padding: 28 },
  toolbar:      { marginBottom: 16 },
  addBtn:       { padding: '8px 16px', background: 'var(--theme-accent)', color: '#fff', border: 'none', borderRadius: 7, fontWeight: 500, cursor: 'pointer' },
  tableWrap:    { background: '#fff', border: '1px solid #e5e5e5', borderRadius: 8, overflow: 'auto' },
  table:        { width: '100%', borderCollapse: 'collapse', minWidth: 760 },
  thead:        { background: '#fafafa' },
  th:           { padding: '10px 12px', textAlign: 'left', fontSize: 11, color: '#888', fontWeight: 500, borderBottom: '1px solid #eee' },
  td:           { padding: '10px 12px', fontSize: 12, borderBottom: '1px solid #f5f5f5', color: '#333' },
  actionsCell:  { whiteSpace: 'nowrap' },
  actionsMobile:{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 6 },
  actionBtnMobile: { width: '100%' },
  empty:        { textAlign: 'center', padding: 32, color: '#aaa', fontSize: 13 },
  statusSelect: { padding: '4px 8px', fontSize: 11, marginRight: 6, border: '1px solid #ddd', borderRadius: 5, textTransform: 'capitalize' },
  statusSelectMobile: { marginRight: 0, width: '100%' },
  deleteBtn:    { padding: '4px 10px', fontSize: 11, background: '#FEE', color: '#c0392b', border: '1px solid #F7C1C1', borderRadius: 5, cursor: 'pointer' },
  label:        { display: 'block', fontSize: 12, fontWeight: 500, color: '#555', marginBottom: 4 },
  input:        { width: '100%', padding: '9px 12px', border: '1px solid #ddd', borderRadius: 7, marginBottom: 14, fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit' },
  modalActions: { display: 'flex', gap: 8, marginTop: 8 },
  saveBtn:      { flex: 1, padding: '9px 0', background: 'var(--theme-accent)', color: '#fff', border: 'none', borderRadius: 7, fontWeight: 500, cursor: 'pointer' },
  cancelBtn:    { flex: 1, padding: '9px 0', background: '#fff', color: '#555', border: '1px solid #ddd', borderRadius: 7, cursor: 'pointer' },
  paginationWrap: { marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  paginationInfo: { fontSize: 12, color: '#64748b' },
  paginationControls: { display: 'flex', alignItems: 'center', gap: 8 },
  pageBtn: { padding: '6px 10px', fontSize: 12, borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', color: '#334155', cursor: 'pointer' },
  pageBtnDisabled: { opacity: 0.5, cursor: 'not-allowed' },
  pageText: { fontSize: 12, color: '#334155', fontWeight: 600 },
};
