import { useEffect, useState } from 'react';
import CustomerLayout from '../../components/CustomerLayout';
import { getMyOrders, createCustomerOrder, getInventoryItems } from '../../services/api';
import { StatusBadge } from './CustomerDashboard';

export default function CustomerOrders() {
  const [orders,    setOrders]    = useState([]);
  const [items,     setItems]     = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading,   setLoading]   = useState(true);
  const [form,      setForm]      = useState({ item_id: '', quantity: '1', delivery_date: '' });
  const [submitting, setSubmitting] = useState(false);
  const [success,   setSuccess]   = useState('');
  const [error,     setError]     = useState('');

  useEffect(() => {
    async function load() {
      try {
        const ordersRes = await getMyOrders();
        setOrders(ordersRes.data.data || []);
        const itemsRes = await getInventoryItems();
        setItems(itemsRes.data.data || []);
      } catch { }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const selectedItem = items.find(i => i.id === Number(form.item_id));
  const pricePerUnit = getItemPrice(selectedItem?.item_name);
  const quantityValue = Number.parseInt(form.quantity, 10);
  const safeQuantity = Number.isInteger(quantityValue) && quantityValue > 0 ? quantityValue : 0;
  const totalAmount  = pricePerUnit * safeQuantity;

  async function handleOrder(e) {
    e.preventDefault();
    if (!form.item_id) return setError('Please select a product.');
    if (!pricePerUnit) {
      return setError('Selected product has no configured customer price yet. Please contact support.');
    }
    if (!safeQuantity || safeQuantity < 1 || safeQuantity > 20) {
      return setError('Quantity must be between 1 and 20.');
    }
    setSubmitting(true);
    setError('');
    try {
      await createCustomerOrder({
        item_id:       Number(form.item_id),
        quantity:      safeQuantity,
        delivery_date: form.delivery_date,
      });
      setSuccess('Order placed successfully!');
      setShowModal(false);
      setForm({ item_id: '', quantity: '1', delivery_date: '' });
      const ordersRes = await getMyOrders();
      setOrders(ordersRes.data.data || []);
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Failed to place order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <CustomerLayout>
      <div style={s.header}>
        <div>
          <h2 style={s.title}>My orders</h2>
          <p style={s.sub}>Track and manage your water deliveries</p>
        </div>
        <button style={s.orderBtn} onClick={() => setShowModal(true)}>+ New order</button>
      </div>

      {success && <div style={s.successBox}>{success}</div>}

      {loading ? (
        <div style={s.empty}>Loading your orders...</div>
      ) : orders.length === 0 ? (
        <div style={s.emptyCard}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
          <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 16 }}>No orders yet. Place your first order!</p>
          <button style={s.orderBtn} onClick={() => setShowModal(true)}>Order now</button>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={s.table}>
            <thead>
              <tr style={s.thead}>
                <th style={s.th}>Product</th>
                <th style={s.th}>Qty</th>
                <th style={s.th}>Status</th>
                <th style={s.th}>Amount</th>
                <th style={s.th}>Payment</th>
                <th style={s.th}>Delivery date</th>
                <th style={s.th}>Ordered on</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={s.td}>{o.item_name || '—'}</td>
                  <td style={s.td}>{o.quantity}</td>
                  <td style={s.td}><StatusBadge status={o.status} /></td>
                  <td style={s.td}>₱{Number(o.amount || 0).toFixed(2)}</td>
                  <td style={s.td}><StatusBadge status={o.bill_status || 'unpaid'} /></td>
                  <td style={s.td}>{o.delivery_date?.slice(0, 10) || '—'}</td>
                  <td style={s.td}>{o.created_at?.slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Order modal */}
      {showModal && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <div style={s.modalHeader}>
              <h3 style={s.modalTitle}>Place new order</h3>
              <button onClick={() => setShowModal(false)} style={s.closeBtn}>✕</button>
            </div>
            <div style={s.modalBody}>
              {error && <div style={s.errorBox}>{error}</div>}

              <label style={s.label}>Select product *</label>
              <select style={s.input} value={form.item_id}
                onChange={e => setForm({ ...form, item_id: e.target.value })}>
                <option value="">Choose a product...</option>
                {items.map(item => (
                  <option
                    key={item.id}
                    value={item.id}
                    disabled={!isRefillItem(item.item_name) && Number(item.quantity || 0) <= 0}
                  >
                    {item.item_name} — {getAvailabilityLabel(item)}
                  </option>
                ))}
              </select>

              <label style={s.label}>Quantity *</label>
              <input style={s.input} type="number" min="1" max="20" value={form.quantity}
                onChange={e => {
                  const value = e.target.value;
                  if (value === '') {
                    setForm({ ...form, quantity: '' });
                    return;
                  }

                  const parsed = Number.parseInt(value, 10);
                  if (Number.isNaN(parsed)) return;
                  setForm({ ...form, quantity: String(Math.max(0, Math.min(20, parsed))) });
                }} />

              <label style={s.label}>Preferred delivery date</label>
              <input style={s.input} type="date" value={form.delivery_date}
                min={new Date().toISOString().slice(0, 10)}
                onChange={e => setForm({ ...form, delivery_date: e.target.value })} />

              {form.item_id && (
                <div style={s.summary}>
                  <div style={s.summaryRow}>
                    <span>Price per unit</span>
                    <span>₱{pricePerUnit}</span>
                  </div>
                  <div style={s.summaryRow}>
                    <span>Quantity</span>
                    <span>{safeQuantity || '—'}</span>
                  </div>
                  <div style={{ ...s.summaryRow, fontWeight: 700, color: '#0ea5e9', borderTop: '1px solid #e0f2fe', paddingTop: 8, marginTop: 4 }}>
                    <span>Total amount</span>
                    <span>₱{totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button onClick={handleOrder} disabled={submitting} style={s.submitBtn}>
                  {submitting ? 'Placing order...' : 'Place order'}
                </button>
                <button onClick={() => setShowModal(false)} style={s.cancelBtn}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </CustomerLayout>
  );
}

const s = {
  header:     { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 },
  title:      { fontSize: 20, fontWeight: 800, color: '#0c1a2e', margin: 0 },
  sub:        { fontSize: 13, color: '#94a3b8', margin: '4px 0 0' },
  orderBtn:   { padding: '10px 20px', background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 600, fontSize: 13, cursor: 'pointer' },
  successBox: { background: '#dcfce7', border: '1px solid #86efac', color: '#166534', padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 16 },
  errorBox:   { background: '#fee2e2', border: '1px solid #fca5a5', color: '#991b1b', padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 14 },
  empty:      { textAlign: 'center', padding: 40, color: '#94a3b8', fontSize: 14 },
  emptyCard:  { background: '#fff', borderRadius: 14, padding: 40, textAlign: 'center', border: '1px solid #e0f2fe' },
  table:      { width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 14, overflow: 'hidden', minWidth: 580 },
  thead:      { background: '#f8fafc' },
  th:         { padding: '10px 14px', textAlign: 'left', fontSize: 11, color: '#94a3b8', fontWeight: 600, borderBottom: '1px solid #f1f5f9' },
  td:         { padding: '12px 14px', fontSize: 12, color: '#374151' },
  overlay:    { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 },
  modal:      { background: '#fff', borderRadius: 16, width: '100%', maxWidth: 460, maxHeight: '90vh', overflow: 'auto' },
  modalHeader:{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #f1f5f9' },
  modalTitle: { fontSize: 16, fontWeight: 700, color: '#0c1a2e', margin: 0 },
  closeBtn:   { background: 'none', border: 'none', fontSize: 16, cursor: 'pointer', color: '#94a3b8' },
  modalBody:  { padding: 20 },
  label:      { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 },
  input:      { width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, marginBottom: 14, boxSizing: 'border-box', color: '#0c1a2e' },
  summary:    { background: '#f0f9ff', borderRadius: 10, padding: '14px 16px', marginTop: 4 },
  summaryRow: { display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#374151', marginBottom: 6 },
  submitBtn:  { flex: 1, padding: '11px 0', background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: 'pointer' },
  cancelBtn:  { padding: '11px 20px', background: '#fff', color: '#64748b', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, cursor: 'pointer' },
};

function getItemPrice(itemName) {
  const label = String(itemName || '').toLowerCase();
  if (!label) return 0;

  if (label.includes('gallon')) return 50;
  if (label.includes('1l') || label.includes('1 liter')) return 25;
  if (label.includes('500')) return 15;
  return 0;
}

function isRefillItem(itemName) {
  return String(itemName || '').toLowerCase().includes('gallon');
}

function getAvailabilityLabel(item) {
  const stock = Number(item?.quantity || 0);
  if (isRefillItem(item?.item_name)) {
    return stock > 0 ? `${stock} in stock` : 'Refill available';
  }
  return stock > 0 ? `${stock} in stock` : 'Out of stock';
}
