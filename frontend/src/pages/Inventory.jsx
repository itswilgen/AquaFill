import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import Spinner from '../components/Spinner';
import { Toast } from '../components/Toast';
import { useToast } from '../hooks/useToast';
import { useWindowSize } from '../hooks/useWindowSize';
import { getInventory, createItem, updateItem, deleteItem } from '../services/api';

const PAGE_SIZE = 10;

export default function Inventory() {
  const { isMobile, isTablet, isNarrow } = useWindowSize();
  const [items,     setItems]     = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing,   setEditing]   = useState(null);
  const [form,      setForm]      = useState({ item_name: '', quantity: 0, unit: 'pcs', reorder_level: 10 });
  const [loading, setLoading] = useState(true);
  const { toast, showToast } = useToast();
  const [animateIn, setAnimateIn] = useState(false);
  const [page, setPage] = useState(1);
  const showExtraColumns = !isMobile;
  const contentPadding = isMobile ? 16 : isTablet ? 20 : 28;
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const pagedItems = items.slice(startIndex, startIndex + PAGE_SIZE);

  async function load() {
    setLoading(true);
    try {
      const res = await getInventory();
      setItems(res.data.data);
    } catch (error) {
      showToast(error?.response?.data?.message || 'Failed to load inventory.', 'error');
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
    setForm({ item_name: '', quantity: 0, unit: 'pcs', reorder_level: 10 });
    setShowModal(true);
  }

  function openEdit(item) {
    setEditing(item);
    setForm({ item_name: item.item_name, quantity: item.quantity, unit: item.unit, reorder_level: item.reorder_level });
    setShowModal(true);
  }


    async function handleSave() {
      try {
        if (editing) {
          await updateItem(editing.id, form);
          showToast('Item updated successfully!');
        } else {
          await createItem(form);
          showToast('Item added successfully!');
        }
  
        setShowModal(false);
        await load();
      } catch (error) {
        showToast(error?.response?.data?.message || 'Something went wrong.', 'error');
      }
    }

    async function handleDelete(id) {
      if (confirm('Delete this Item?')) {
        await deleteItem(id);
        showToast('Item deleted.');
        await load();
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

      <PageHeader title="Inventory" subtitle="Monitor your stock levels" />

      <div style={{ ...styles.content, padding: contentPadding }}>
        <div style={{ ...styles.toolbar, ...(animateIn ? { animation: 'adminFadeUp 0.42s ease both' } : {}) }}>
          <button
            className="admin-action-btn"
            style={{ ...styles.addBtn, width: isMobile ? '100%' : 'auto' }}
            onClick={openAdd}
          >
            + Add item
          </button>
        </div>

        {loading ? <Spinner /> : (
          <div
            className="admin-table-wrap"
            style={{ ...styles.tableWrap, ...(animateIn ? { animation: 'adminFadeUp 0.45s ease 0.08s both' } : {}) }}
          >
            <table style={{ ...styles.table, minWidth: showExtraColumns ? 760 : (isNarrow ? 420 : 520) }}>
              <thead>
                <tr style={styles.thead}>
                  <th style={styles.th}>Item name</th>
                  <th style={styles.th}>Quantity</th>
                  <th style={styles.th}>Unit</th>
                  {showExtraColumns && <th style={styles.th}>Reorder level</th>}
                  <th style={styles.th}>Status</th>
                  {showExtraColumns && <th style={styles.th}>Last updated</th>}
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={showExtraColumns ? 7 : 5} style={{ textAlign: 'center', padding: 32, color: '#aaa', fontSize: 13 }}>
                      No inventory items found
                    </td>
                  </tr>
                ) : pagedItems.map((item, index) => {
                  const isLow = item.quantity <= item.reorder_level;
                  return (
                    <tr
                      key={item.id}
                      className="admin-row"
                      style={animateIn ? { animation: `adminFadeIn 0.32s ease ${0.12 + (index * 0.03)}s both` } : undefined}
                    >
                      <td style={styles.td}>{item.item_name}</td>
                      <td style={styles.td}>{item.quantity}</td>
                      <td style={styles.td}>{item.unit}</td>
                      {showExtraColumns && <td style={styles.td}>{item.reorder_level}</td>}
                      <td style={styles.td}>
                        <span style={isLow ? styles.badgeLow : styles.badgeOk}>
                          {isLow ? 'Low stock' : 'OK'}
                        </span>
                      </td>
                      {showExtraColumns && <td style={styles.td}>{item.updated_at?.slice(0, 10)}</td>}
                      <td style={{ ...styles.td, ...styles.actionsCell, ...(isNarrow ? styles.actionsMobile : {}) }}>
                        <button className="admin-action-btn" style={{ ...styles.editBtn, ...(isNarrow ? styles.actionBtnMobile : {}) }} onClick={() => openEdit(item)}>Edit</button>
                        <button className="admin-action-btn" style={{ ...styles.deleteBtn, ...(isNarrow ? styles.actionBtnMobile : {}) }} onClick={() => handleDelete(item.id)}>Delete</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && items.length > 0 && (
          <div style={styles.paginationWrap}>
            <div style={styles.paginationInfo}>
              Showing {startIndex + 1}-{Math.min(startIndex + PAGE_SIZE, items.length)} of {items.length}
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
        <Modal title={editing ? 'Edit item' : 'Add item'} onClose={() => setShowModal(false)}>
          <label style={styles.label}>Item name *</label>
          <input style={styles.input} value={form.item_name}
            onChange={e => setForm({ ...form, item_name: e.target.value })} placeholder="e.g. 5-gallon bottle" />

          <label style={styles.label}>Quantity</label>
          <input style={styles.input} type="number" min="0" value={form.quantity}
            onChange={e => setForm({ ...form, quantity: e.target.value })} />

          <label style={styles.label}>Unit</label>
          <select style={styles.input} value={form.unit}
            onChange={e => setForm({ ...form, unit: e.target.value })}>
            <option value="pcs">pcs</option>
            <option value="liters">liters</option>
            <option value="gallons">gallons</option>
            <option value="boxes">boxes</option>
          </select>

          <label style={styles.label}>Reorder level</label>
          <input style={styles.input} type="number" min="0" value={form.reorder_level}
            onChange={e => setForm({ ...form, reorder_level: e.target.value })} />

          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexDirection: isMobile ? 'column' : 'row' }}>
            <button style={styles.saveBtn}   onClick={handleSave}>Save</button>
            <button style={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
          </div>
        </Modal>
      )}

      <Toast toast={toast} />

    </Layout>
  );
}

const styles = {
  content:   { padding: 28 },
  toolbar:   { marginBottom: 16 },
  addBtn:    { padding: '8px 16px', background: 'var(--theme-accent)', color: '#fff', border: 'none', borderRadius: 7, fontWeight: 500 },
  tableWrap: { background: '#fff', border: '1px solid #e5e5e5', borderRadius: 8, overflow: 'auto' },
  table:     { width: '100%', borderCollapse: 'collapse' },
  thead:     { background: '#fafafa' },
  th:        { padding: '10px 12px', textAlign: 'left', fontSize: 11, color: '#888', fontWeight: 500, borderBottom: '1px solid #eee' },
  td:        { padding: '10px 12px', fontSize: 12, borderBottom: '1px solid #f5f5f5' },
  actionsCell: { whiteSpace: 'nowrap' },
  actionsMobile: { display: 'flex', flexDirection: 'column', gap: 6 },
  actionBtnMobile: { width: '100%', marginRight: 0 },
  badgeOk:   { background: '#EAF3DE', color: '#27500A', padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 500 },
  badgeLow:  { background: '#FCEBEB', color: '#791F1F', padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 500 },
  editBtn:   { padding: '4px 10px', fontSize: 11, marginRight: 6, background: 'var(--theme-accent-soft)', color: 'var(--theme-accent)', border: '1px solid var(--theme-accent-border)', borderRadius: 5, cursor: 'pointer' },
  deleteBtn: { padding: '4px 10px', fontSize: 11, background: '#FEE', color: '#c0392b', border: '1px solid #F7C1C1', borderRadius: 5, cursor: 'pointer' },
  label:     { display: 'block', fontSize: 12, fontWeight: 500, color: '#555', marginBottom: 4 },
  input:     { width: '100%', padding: '9px 12px', border: '1px solid #ddd', borderRadius: 7, marginBottom: 14, fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit' },
  saveBtn:   { flex: 1, padding: '9px 0', background: 'var(--theme-accent)', color: '#fff', border: 'none', borderRadius: 7, fontWeight: 500, cursor: 'pointer' },
  cancelBtn: { flex: 1, padding: '9px 0', background: '#fff', color: '#555', border: '1px solid #ddd', borderRadius: 7, cursor: 'pointer' },
  paginationWrap: { marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  paginationInfo: { fontSize: 12, color: '#64748b' },
  paginationControls: { display: 'flex', alignItems: 'center', gap: 8 },
  pageBtn: { padding: '6px 10px', fontSize: 12, borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', color: '#334155', cursor: 'pointer' },
  pageBtnDisabled: { opacity: 0.5, cursor: 'not-allowed' },
  pageText: { fontSize: 12, color: '#334155', fontWeight: 600 },
};
