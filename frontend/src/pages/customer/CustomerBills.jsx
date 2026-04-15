import { useEffect, useState } from 'react';
import CustomerLayout from '../../components/CustomerLayout';
import { getOrdersByCustomer, payBill, searchCustomers } from '../../services/api';
import { StatusBadge } from './CustomerDashboard';

const paymentChannels = {
  gcash: {
    label: 'GCash',
    accountName: 'AquaFill Water Station',
    accountNo: '0917 123 4567',
    note: 'Send payment to this GCash number, then upload your screenshot and reference number.',
  },
  maya: {
    label: 'Maya',
    accountName: 'AquaFill Water Station',
    accountNo: '0918 765 4321',
    note: 'Use Maya Send Money and upload your payment screenshot before submitting.',
  },
  gotyme: {
    label: 'GoTyme',
    accountName: 'AquaFill Water Station',
    accountNo: '0899 555 6677',
    note: 'Transfer using GoTyme and upload the transaction screenshot.',
  },
  bank: {
    label: 'Bank Transfer',
    accountName: 'AquaFill Water Station',
    accountNo: 'BDO 0012-3456-7890',
    note: 'Transfer to the bank account and upload proof of payment screenshot.',
  },
};

export default function CustomerBills() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');
  const [paymentForm, setPaymentForm] = useState({
    method: 'gcash',
    reference_no: '',
    payer_name: '',
    proof_file: null,
    proof_filename: '',
  });

  async function load() {
    try {
      const res = await searchCustomers(user.name || user.username || '');
      const customers = res.data.data;
      if (customers.length > 0) {
        const ordersRes = await getOrdersByCustomer(customers[0].id);
        setOrders(ordersRes.data.data.filter((o) => o.amount));
      }
    } catch {}
    finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openPayModal(order) {
    setSelectedBill(order);
    setPaymentForm({
      method: 'gcash',
      reference_no: '',
      payer_name: user.name || user.username || '',
      proof_file: null,
      proof_filename: '',
    });
    setError('');
    setShowPayModal(true);
  }

  function closePayModal() {
    setShowPayModal(false);
    setSelectedBill(null);
    setError('');
  }

  function handleProofChange(e) {
    const file = e.target.files?.[0];
    if (!file) {
      setPaymentForm((prev) => ({ ...prev, proof_file: null, proof_filename: '' }));
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPG, PNG, or WEBP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Screenshot is too large. Please upload an image below 5MB.');
      return;
    }

    setPaymentForm((prev) => ({
      ...prev,
      proof_file: file,
      proof_filename: file.name,
    }));
    setError('');
  }

  async function handlePaySubmit(e) {
    e.preventDefault();
    if (!selectedBill?.bill_id) return;

    if (!paymentForm.reference_no.trim()) {
      setError('Payment reference number is required.');
      return;
    }

    if (!paymentForm.proof_file) {
      setError('Screenshot proof is required before you can submit.');
      return;
    }

    try {
      setPaying(true);
      setError('');

      const payload = new FormData();
      payload.append('payment_method', paymentForm.method);
      payload.append('reference_no', paymentForm.reference_no.trim());
      payload.append('payer_name', paymentForm.payer_name.trim());
      payload.append('proof_file', paymentForm.proof_file);

      await payBill(selectedBill.bill_id, payload);

      closePayModal();
      setSuccess(`Payment submitted via ${paymentChannels[paymentForm.method].label}.`);
      await load();
      setTimeout(() => setSuccess(''), 3500);
    } catch (err) {
      setError(err?.response?.data?.message || 'Payment failed. Please try again.');
    } finally {
      setPaying(false);
    }
  }

  const totalDue = orders
    .filter((o) => o.bill_status === 'unpaid')
    .reduce((s, o) => s + Number(o.amount || 0), 0);
  const totalPaid = orders
    .filter((o) => o.bill_status === 'paid')
    .reduce((s, o) => s + Number(o.amount || 0), 0);

  return (
    <CustomerLayout>
      <h2 style={s.title}>My bills</h2>
      <p style={s.sub}>View and pay your outstanding balances</p>

      {success && <div style={s.successBox}>{success}</div>}
      {error && !showPayModal && <div style={s.errorBox}>{error}</div>}

      <div style={s.grid2}>
        <div style={{ ...s.metric, borderColor: '#fca5a5' }}>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>Amount due</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#ef4444' }}>P{totalDue.toFixed(2)}</div>
        </div>
        <div style={{ ...s.metric, borderColor: '#86efac' }}>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>Total paid</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#16a34a' }}>P{totalPaid.toFixed(2)}</div>
        </div>
      </div>

      {loading ? (
        <div style={s.empty}>Loading your bills...</div>
      ) : orders.length === 0 ? (
        <div style={s.emptyCard}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>💳</div>
          <p style={{ color: '#94a3b8', fontSize: 14 }}>No bills found.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={s.table}>
            <thead>
              <tr style={s.thead}>
                <th style={s.th}>Qty</th>
                <th style={s.th}>Amount</th>
                <th style={s.th}>Status</th>
                <th style={s.th}>Paid at</th>
                <th style={s.th}>Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={s.td}>{o.quantity}</td>
                  <td style={s.td}>P{Number(o.amount || 0).toFixed(2)}</td>
                  <td style={s.td}>
                    <StatusBadge status={o.bill_status || 'unpaid'} />
                  </td>
                  <td style={s.td}>{o.paid_at ? o.paid_at.slice(0, 10) : '—'}</td>
                  <td style={s.td}>
                    {o.bill_status === 'unpaid' && o.bill_id ? (
                      <button style={s.payBtn} onClick={() => openPayModal(o)}>
                        Pay now
                      </button>
                    ) : (
                      <span style={{ fontSize: 12, color: '#94a3b8' }}>Paid</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showPayModal && selectedBill && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <div style={s.modalHeader}>
              <h3 style={s.modalTitle}>Online payment</h3>
              <button onClick={closePayModal} style={s.closeBtn}>✕</button>
            </div>
            <form style={s.modalBody} onSubmit={handlePaySubmit}>
              <div style={s.billSummary}>
                <div style={s.summaryRow}>
                  <span>Order</span>
                  <strong>#{selectedBill.id}</strong>
                </div>
                <div style={s.summaryRow}>
                  <span>Amount</span>
                  <strong>P{Number(selectedBill.amount || 0).toFixed(2)}</strong>
                </div>
              </div>

              <label style={s.label}>Payment method</label>
              <select
                style={s.input}
                value={paymentForm.method}
                onChange={(e) => setPaymentForm((prev) => ({ ...prev, method: e.target.value }))}
              >
                <option value="gcash">GCash</option>
                <option value="maya">Maya</option>
                <option value="gotyme">GoTyme</option>
                <option value="bank">Bank Transfer</option>
              </select>

              <div style={s.channelCard}>
                <div style={s.channelLabel}>{paymentChannels[paymentForm.method].label}</div>
                <div style={s.channelAccount}>{paymentChannels[paymentForm.method].accountName}</div>
                <div style={s.channelNo}>{paymentChannels[paymentForm.method].accountNo}</div>
                <p style={s.channelNote}>{paymentChannels[paymentForm.method].note}</p>
              </div>

              <label style={s.label}>Payer name (optional)</label>
              <input
                style={s.input}
                value={paymentForm.payer_name}
                onChange={(e) => setPaymentForm((prev) => ({ ...prev, payer_name: e.target.value }))}
                placeholder="Name used in transfer"
              />

              <label style={s.label}>Reference number *</label>
              <input
                style={s.input}
                value={paymentForm.reference_no}
                onChange={(e) => setPaymentForm((prev) => ({ ...prev, reference_no: e.target.value }))}
                placeholder="Transaction reference number"
              />

              <label style={s.label}>Upload screenshot proof *</label>
              <input
                style={s.fileInput}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleProofChange}
              />
              {paymentForm.proof_filename && (
                <div style={s.fileName}>Selected file: {paymentForm.proof_filename}</div>
              )}

              {error && <div style={s.errorBox}>{error}</div>}

              <div style={s.modalActions}>
                <button type="button" style={s.cancelBtn} onClick={closePayModal}>Cancel</button>
                <button type="submit" style={s.confirmBtn} disabled={paying}>
                  {paying ? 'Submitting...' : 'Submit payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </CustomerLayout>
  );
}

const s = {
  title: { fontSize: 20, fontWeight: 800, color: '#0c1a2e', margin: '0 0 4px' },
  sub: { fontSize: 13, color: '#94a3b8', margin: '0 0 20px' },
  successBox: {
    background: '#dcfce7',
    border: '1px solid #86efac',
    color: '#166534',
    padding: '10px 14px',
    borderRadius: 10,
    fontSize: 13,
    marginBottom: 16,
  },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 },
  metric: { background: '#fff', borderRadius: 14, padding: '18px 16px', border: '1px solid #e0f2fe' },
  empty: { textAlign: 'center', padding: 40, color: '#94a3b8', fontSize: 14 },
  emptyCard: { background: '#fff', borderRadius: 14, padding: 40, textAlign: 'center', border: '1px solid #e0f2fe' },
  table: { width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 14, overflow: 'hidden', minWidth: 480 },
  thead: { background: '#f8fafc' },
  th: { padding: '10px 14px', textAlign: 'left', fontSize: 11, color: '#94a3b8', fontWeight: 600, borderBottom: '1px solid #f1f5f9' },
  td: { padding: '12px 14px', fontSize: 12, color: '#374151' },
  payBtn: { padding: '5px 14px', background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 },
  modal: { background: '#fff', borderRadius: 16, width: '100%', maxWidth: 460, maxHeight: '90vh', overflow: 'auto' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #f1f5f9' },
  modalTitle: { fontSize: 16, fontWeight: 700, color: '#0c1a2e', margin: 0 },
  closeBtn: { background: 'none', border: 'none', fontSize: 16, cursor: 'pointer', color: '#94a3b8' },
  modalBody: { padding: 20 },
  billSummary: { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 12px', marginBottom: 14 },
  summaryRow: { display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#334155', marginBottom: 4 },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 },
  input: { width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, marginBottom: 14, boxSizing: 'border-box', color: '#0c1a2e' },
  fileInput: { width: '100%', padding: '8px 10px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 13, marginBottom: 8, boxSizing: 'border-box', color: '#0c1a2e', background: '#fff' },
  fileName: { fontSize: 12, color: '#0e7490', marginBottom: 14 },
  channelCard: { background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 10, padding: '12px 14px', marginBottom: 14 },
  channelLabel: { fontSize: 12, color: '#0369a1', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase' },
  channelAccount: { fontSize: 13, color: '#0c1a2e', fontWeight: 600, marginBottom: 2 },
  channelNo: { fontSize: 14, color: '#0c1a2e', fontWeight: 800, letterSpacing: 0.2, marginBottom: 6 },
  channelNote: { fontSize: 12, color: '#475569', margin: 0, lineHeight: 1.5 },
  errorBox: { background: '#fee2e2', border: '1px solid #fca5a5', color: '#991b1b', padding: '10px 12px', borderRadius: 10, fontSize: 12, marginBottom: 12 },
  modalActions: { display: 'flex', gap: 10, marginTop: 4 },
  cancelBtn: { flex: 1, padding: '11px 12px', background: '#fff', color: '#64748b', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 13, cursor: 'pointer' },
  confirmBtn: { flex: 1, padding: '11px 12px', background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' },
};
