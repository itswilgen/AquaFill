import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import Spinner from '../components/Spinner';
import { Toast } from '../components/Toast';
import { useToast } from '../hooks/useToast';
import { useWindowSize } from '../hooks/useWindowSize';
import { createCustomer, deleteCustomer, getCustomers, updateCustomer } from '../services/api';

const emptyForm = { name: '', address: '', phone: '' };
const PAGE_SIZE = 10;

export default function Customers() {
  const { isMobile, isTablet, isNarrow } = useWindowSize();
  const [customers, setCustomers] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing,   setEditing]   = useState(null);
  const [form,      setForm]      = useState(emptyForm);
  const { toast, showToast }      = useToast();
  const [animateIn, setAnimateIn] = useState(false);
  const [page, setPage] = useState(1);
  const showExtraColumns = !isMobile;
  const contentPadding = isMobile ? 16 : isTablet ? 20 : 28;
  const totalPages = Math.max(1, Math.ceil(customers.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const pagedCustomers = customers.slice(startIndex, startIndex + PAGE_SIZE);

  async function load() {
    setLoading(true);
    try {
      const res = await getCustomers();
      setCustomers(res.data.data || []);
    } catch (error) {
      showToast(error?.response?.data?.message || 'Failed to load customers.', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setAnimateIn(true), 60);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    setPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  }

  function openEdit(customer) {
    setEditing(customer);
    setForm({
      name: customer.name || '',
      address: customer.address || '',
      phone: customer.phone || '',
    });
    setShowModal(true);
  }

  async function handleSave() {
    const payload = {
      name: form.name.trim(),
      address: form.address.trim(),
      phone: form.phone.trim(),
    };

    if (!payload.name) {
      showToast('Customer name is required.', 'error');
      return;
    }

    try {
      if (editing) {
        await updateCustomer(editing.id, payload);
        showToast('Customer updated successfully.');
      } else {
        await createCustomer(payload);
        showToast('Customer added successfully.');
      }

      setShowModal(false);
      await load();
    } catch (error) {
      showToast(error?.response?.data?.message || 'Failed to save customer.', 'error');
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this customer?')) return;

    try {
      await deleteCustomer(id);
      showToast('Customer deleted.', 'info');
      await load();
    } catch (error) {
      showToast(error?.response?.data?.message || 'Failed to delete customer.', 'error');
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

      <PageHeader title="Customers" subtitle="Manage customer records and contact details" />

      <div style={{ ...styles.content, padding: contentPadding }}>
        <div style={{ ...styles.toolbar, ...(animateIn ? { animation: 'adminFadeUp 0.42s ease both' } : {}) }}>
          <button
            className="admin-action-btn"
            style={{ ...styles.addBtn, width: isMobile ? '100%' : 'auto' }}
            onClick={openAdd}
          >
            + Add customer
          </button>
        </div>

        {loading ? <Spinner /> : (
          <div
            className="admin-table-wrap"
            style={{ ...styles.tableWrap, ...(animateIn ? { animation: 'adminFadeUp 0.45s ease 0.08s both' } : {}) }}
          >
            <table style={{ ...styles.table, minWidth: showExtraColumns ? 720 : (isNarrow ? 420 : 520) }}>
              <thead>
                <tr style={styles.thead}>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Phone</th>
                  <th style={styles.th}>Address</th>
                  {showExtraColumns && <th style={styles.th}>Balance</th>}
                  {showExtraColumns && <th style={styles.th}>Joined</th>}
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.length === 0 ? (
                  <tr>
                    <td colSpan={showExtraColumns ? 6 : 4} style={styles.empty}>No customers found</td>
                  </tr>
                ) : pagedCustomers.map((customer, index) => (
                  <tr
                    key={customer.id}
                    className="admin-row"
                    style={animateIn ? { animation: `adminFadeIn 0.32s ease ${0.12 + (index * 0.03)}s both` } : undefined}
                  >
                    <td style={styles.td}>{customer.name}</td>
                    <td style={styles.td}>{customer.phone || '-'}</td>
                    <td style={styles.td}>{customer.address || '-'}</td>
                    {showExtraColumns && <td style={styles.td}>PHP {Number(customer.balance || 0).toFixed(2)}</td>}
                    {showExtraColumns && <td style={styles.td}>{customer.created_at?.slice(0, 10) || '-'}</td>}
                    <td style={{ ...styles.td, ...styles.actionsCell, ...(isNarrow ? styles.actionsMobile : {}) }}>
                      <button className="admin-action-btn" style={{ ...styles.editBtn, ...(isNarrow ? styles.actionBtnMobile : {}) }} onClick={() => openEdit(customer)}>Edit</button>
                      <button className="admin-action-btn" style={{ ...styles.deleteBtn, ...(isNarrow ? styles.actionBtnMobile : {}) }} onClick={() => handleDelete(customer.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && customers.length > 0 && (
          <div style={styles.paginationWrap}>
            <div style={styles.paginationInfo}>
              Showing {startIndex + 1}-{Math.min(startIndex + PAGE_SIZE, customers.length)} of {customers.length}
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
        <Modal title={editing ? 'Edit customer' : 'Add customer'} onClose={() => setShowModal(false)}>
          <label style={styles.label}>Name *</label>
          <input
            style={styles.input}
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="Customer name"
          />

          <label style={styles.label}>Phone</label>
          <input
            style={styles.input}
            value={form.phone}
            onChange={e => setForm({ ...form, phone: e.target.value })}
            placeholder="Phone number"
          />

          <label style={styles.label}>Address</label>
          <textarea
            style={{ ...styles.input, minHeight: 90, resize: 'vertical' }}
            value={form.address}
            onChange={e => setForm({ ...form, address: e.target.value })}
            placeholder="Delivery address"
          />

          <div style={{ ...styles.modalActions, flexDirection: isMobile ? 'column' : 'row' }}>
            <button style={styles.saveBtn} onClick={handleSave}>Save</button>
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
  table:        { width: '100%', borderCollapse: 'collapse', minWidth: 720 },
  thead:        { background: '#fafafa' },
  th:           { padding: '10px 12px', textAlign: 'left', fontSize: 11, color: '#888', fontWeight: 500, borderBottom: '1px solid #eee' },
  td:           { padding: '10px 12px', fontSize: 12, borderBottom: '1px solid #f5f5f5', color: '#333', verticalAlign: 'top' },
  actionsCell:  { whiteSpace: 'nowrap' },
  actionsMobile:{ display: 'flex', flexDirection: 'column', gap: 6 },
  actionBtnMobile: { width: '100%', marginRight: 0 },
  empty:        { textAlign: 'center', padding: 32, color: '#aaa', fontSize: 13 },
  editBtn:      { padding: '4px 10px', fontSize: 11, marginRight: 6, background: 'var(--theme-accent-soft)', color: 'var(--theme-accent)', border: '1px solid var(--theme-accent-border)', borderRadius: 5, cursor: 'pointer' },
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
