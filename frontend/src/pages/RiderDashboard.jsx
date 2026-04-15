import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { confirmRiderDelivery, getRiderOrders } from '../services/api';
import { StatusBadge } from './Dashboard';

const RIDER_ORIGIN = 'Brgy Tugas, Tanjay City, Negros Oriental, Philippines';
const PAGE_SIZE = 10;

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}');
  } catch {
    return {};
  }
}

function normalizeCustomerDestination(address) {
  const raw = String(address || '').trim().replace(/\s+/g, ' ');
  if (!raw) return '';

  const lower = raw.toLowerCase();
  const hasLocalContext =
    lower.includes('tanjay') || lower.includes('negros') || lower.includes('philippines');

  return hasLocalContext ? raw : `${raw}, Tanjay City, Negros Oriental, Philippines`;
}

function buildMapUrl(address) {
  const value = normalizeCustomerDestination(address);
  if (!value) return '';
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(value)}`;
}

function buildDirectionsUrl(address, origin = RIDER_ORIGIN) {
  const value = normalizeCustomerDestination(address);
  if (!value) return '';
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(value)}&travelmode=driving`;
}

function buildCallHref(phone) {
  const raw = String(phone || '').trim();
  if (!raw) return '';
  const normalized = raw.replace(/[^+\d]/g, '');
  return normalized ? `tel:${normalized}` : '';
}

export default function RiderDashboard() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [codPaid, setCodPaid] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);

  async function load({ silent = false } = {}) {
    try {
      if (!silent) setLoading(true);
      const res = await getRiderOrders();
      setOrders(res.data.data || []);
      setError('');
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load rider queue.');
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

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  }

  function openConfirm(order) {
    setSelectedOrder(order);
    setCodPaid(order.bill_status !== 'paid');
    setError('');
    setShowModal(true);
  }

  function closeConfirm() {
    if (submitting) return;
    setShowModal(false);
    setSelectedOrder(null);
    setCodPaid(false);
  }

  async function handleConfirmDelivery() {
    if (!selectedOrder) return;

    try {
      setSubmitting(true);
      setError('');
      const res = await confirmRiderDelivery(selectedOrder.id, { cod_paid: codPaid });
      setSuccess(res?.data?.message || 'Delivery confirmation saved.');
      closeConfirm();
      await load();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to confirm delivery.');
    } finally {
      setSubmitting(false);
    }
  }

  const counts = useMemo(() => {
    const pending = orders.filter((o) => o.status === 'pending').length;
    const delivered = orders.filter((o) => o.status === 'delivered').length;
    const unpaid = orders.filter((o) => o.bill_status === 'unpaid').length;
    return { pending, delivered, unpaid };
  }, [orders]);
  const totalPages = Math.max(1, Math.ceil(orders.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const pagedOrders = orders.slice(startIndex, startIndex + PAGE_SIZE);

  useEffect(() => {
    setPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  function handleDirectionsClick(event, address) {
    event.preventDefault();
    const destination = normalizeCustomerDestination(address);
    if (!destination) return;

    const fallbackUrl = buildDirectionsUrl(destination, RIDER_ORIGIN);
    const mapTab = window.open(fallbackUrl, '_blank', 'noopener,noreferrer');
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const liveOrigin = `${position.coords.latitude},${position.coords.longitude}`;
        const liveUrl = buildDirectionsUrl(destination, liveOrigin);
        if (mapTab && !mapTab.closed) {
          mapTab.location.href = liveUrl;
        } else {
          window.open(liveUrl, '_blank', 'noopener,noreferrer');
        }
      },
      () => {
        // Keep fallback origin at Brgy Tugas if geolocation is denied/unavailable.
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  }

  return (
    <div style={s.page}>
      <header style={s.topbar}>
        <div>
          <h1 style={s.title}>Rider Confirmation Dashboard</h1>
          <p style={s.sub}>Confirm deliveries and COD collection in real time</p>
        </div>
        <div style={s.userBox}>
          <span style={s.userText}>{user.name || user.username || 'Rider'}</span>
          <button style={s.logoutBtn} onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <main style={s.content}>
        {success && <div style={s.success}>{success}</div>}
        {error && !showModal && <div style={s.error}>{error}</div>}

        <div style={s.metrics}>
          <div style={{ ...s.metric, ...s.metricPending }}>
            <div style={{ ...s.metricLabel, color: '#7a4a16' }}>Pending deliveries</div>
            <div style={{ ...s.metricValue, color: '#92400e' }}>{counts.pending}</div>
          </div>
          <div style={{ ...s.metric, ...s.metricDelivered }}>
            <div style={{ ...s.metricLabel, color: '#2e6040' }}>Delivered</div>
            <div style={{ ...s.metricValue, color: '#166534' }}>{counts.delivered}</div>
          </div>
          <div style={{ ...s.metric, ...s.metricUnpaid }}>
            <div style={{ ...s.metricLabel, color: '#7a3b3b' }}>Unpaid bills</div>
            <div style={{ ...s.metricValue, color: '#991b1b' }}>{counts.unpaid}</div>
          </div>
        </div>

        {loading ? (
          <div style={s.empty}>Loading rider queue...</div>
        ) : (
          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead>
                <tr style={s.thead}>
                  <th style={s.th}>Customer</th>
                  <th style={s.th}>Location</th>
                  <th style={s.th}>Qty</th>
                  <th style={s.th}>Order status</th>
                  <th style={s.th}>Bill</th>
                  <th style={s.th}>Payment</th>
                  <th style={s.th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td style={s.emptyRow} colSpan={8}>No delivery records found.</td>
                  </tr>
                ) : (
                  pagedOrders.map((order) => {
                    const completed = order.status === 'delivered' && order.bill_status === 'paid';
                    const address = order.customer_address || '';
                    const phone = String(order.customer_phone || '').trim();
                    const callHref = buildCallHref(phone);
                    const mapUrl = buildMapUrl(address);
                    const directionsUrl = buildDirectionsUrl(address);
                    return (
                      <tr key={order.id}>
                        <td style={s.td}>
                          <div style={s.customerName}>{order.customer_name}</div>
                          {phone ? (
                            <div style={s.customerContactRow}>
                              <div style={s.customerPhone}>{phone}</div>
                              {callHref ? (
                                <a href={callHref} style={s.callBtn}>
                                  Call
                                </a>
                              ) : null}
                            </div>
                          ) : (
                            <div style={s.noPhone}>No phone</div>
                          )}
                        </td>
                        <td style={s.td}>
                          {address ? (
                            <div style={s.locationWrap}>
                              <div style={s.addressText} title={address}>{address}</div>
                              <a
                                href={mapUrl}
                                target="_blank"
                                rel="noreferrer"
                                style={s.mapLink}
                              >
                                View map
                              </a>
                              <a
                                href={directionsUrl}
                                target="_blank"
                                rel="noreferrer"
                                style={s.directionLink}
                                onClick={(event) => handleDirectionsClick(event, address)}
                              >
                                Directions
                              </a>
                            </div>
                          ) : (
                            <span style={s.noAddress}>No address</span>
                          )}
                        </td>
                        <td style={s.td}>{order.quantity}</td>
                        <td style={s.td}><StatusBadge status={order.status} /></td>
                        <td style={s.td}>PHP {Number(order.amount || 0).toFixed(2)}</td>
                        <td style={s.td}><StatusBadge status={order.bill_status || 'unpaid'} /></td>
                        <td style={s.td}>
                          {completed ? (
                            <span style={s.completedText}>Completed</span>
                          ) : (
                            <button style={s.actionBtn} onClick={() => openConfirm(order)}>
                              {order.status === 'delivered' ? 'Update COD' : 'Confirm delivery'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {!loading && orders.length > 0 && (
          <div style={s.paginationWrap}>
            <div style={s.paginationInfo}>
              Showing {startIndex + 1}-{Math.min(startIndex + PAGE_SIZE, orders.length)} of {orders.length}
            </div>
            <div style={s.paginationControls}>
              <button
                type="button"
                style={{ ...s.pageBtn, ...(currentPage === 1 ? s.pageBtnDisabled : {}) }}
                disabled={currentPage === 1}
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              >
                Previous
              </button>
              <span style={s.pageText}>Page {currentPage} of {totalPages}</span>
              <button
                type="button"
                style={{ ...s.pageBtn, ...(currentPage === totalPages ? s.pageBtnDisabled : {}) }}
                disabled={currentPage === totalPages}
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </main>

      {showModal && selectedOrder && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <h3 style={s.modalTitle}>Confirm Order #{selectedOrder.id}</h3>
            <p style={s.modalSub}>Set delivery as completed. Enable COD only if cash was collected.</p>

            <label style={s.checkboxRow}>
              <input
                type="checkbox"
                checked={codPaid}
                onChange={(e) => setCodPaid(e.target.checked)}
                style={s.checkbox}
              />
              Customer paid via Cash on Delivery (auto-mark bill as paid)
            </label>

            {error && <div style={s.error}>{error}</div>}

            <div style={s.modalActions}>
              <button style={s.cancelBtn} onClick={closeConfirm} disabled={submitting}>Cancel</button>
              <button style={s.confirmBtn} onClick={handleConfirmDelivery} disabled={submitting}>
                {submitting ? 'Saving...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', background: 'var(--theme-page-bg)' },
  topbar: { background: '#fff', borderBottom: '1px solid var(--theme-page-border)', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title: { margin: 0, fontSize: 20, fontWeight: 700, color: '#111827' },
  sub: { margin: '4px 0 0', fontSize: 13, color: '#6b7280' },
  userBox: { display: 'flex', alignItems: 'center', gap: 10 },
  userText: { fontSize: 13, color: '#334155', fontWeight: 600 },
  logoutBtn: { padding: '7px 12px', border: '1px solid #d1d5db', borderRadius: 6, background: '#fff', cursor: 'pointer', fontSize: 12 },
  content: { padding: 24 },
  success: { background: '#dcfce7', color: '#166534', border: '1px solid #86efac', borderRadius: 8, padding: '10px 12px', fontSize: 13, marginBottom: 14 },
  error: { background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 12px', fontSize: 13, marginBottom: 14 },
  metrics: { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 12, marginBottom: 16 },
  metric: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '14px 16px' },
  metricPending: { background: '#FFF4E5', borderColor: '#F8D7A8' },
  metricDelivered: { background: '#EAF8EA', borderColor: '#BFE6C0' },
  metricUnpaid: { background: '#FFF1F1', borderColor: '#F7CACA' },
  metricLabel: { fontSize: 12, color: '#6b7280', marginBottom: 6 },
  metricValue: { fontSize: 22, fontWeight: 700, color: '#0f172a' },
  tableWrap: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: 980 },
  thead: { background: '#f8fafc' },
  th: { padding: '10px 12px', fontSize: 11, textAlign: 'left', color: '#6b7280', borderBottom: '1px solid #e5e7eb', fontWeight: 600 },
  td: { padding: '10px 12px', fontSize: 12, color: '#334155', borderBottom: '1px solid #f1f5f9' },
  customerName: { fontSize: 12, fontWeight: 600, color: '#0f172a' },
  customerContactRow: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' },
  customerPhone: { fontSize: 11, color: '#64748b' },
  noPhone: { fontSize: 11, color: '#94a3b8', marginTop: 4 },
  callBtn: { display: 'inline-block', padding: '3px 8px', fontSize: 11, fontWeight: 600, color: '#fff', background: '#16a34a', borderRadius: 6, textDecoration: 'none' },
  locationWrap: { display: 'flex', flexDirection: 'column', gap: 5, minWidth: 220, maxWidth: 300 },
  addressText: { fontSize: 11, color: '#475569', lineHeight: 1.4 },
  mapLink: { display: 'inline-block', width: 'fit-content', fontSize: 11, color: 'var(--theme-link)', textDecoration: 'none', fontWeight: 600 },
  directionLink: { display: 'inline-block', width: 'fit-content', fontSize: 11, color: '#0f766e', textDecoration: 'none', fontWeight: 600 },
  noAddress: { fontSize: 11, color: '#94a3b8' },
  empty: { textAlign: 'center', color: '#94a3b8', padding: 32, fontSize: 14 },
  emptyRow: { textAlign: 'center', color: '#94a3b8', padding: 24, fontSize: 13 },
  paginationWrap: { marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  paginationInfo: { fontSize: 12, color: '#64748b' },
  paginationControls: { display: 'flex', alignItems: 'center', gap: 8 },
  pageBtn: { padding: '6px 10px', fontSize: 12, borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', color: '#334155', cursor: 'pointer' },
  pageBtnDisabled: { opacity: 0.5, cursor: 'not-allowed' },
  pageText: { fontSize: 12, color: '#334155', fontWeight: 600 },
  actionBtn: { padding: '6px 10px', background: 'var(--theme-accent)', border: 'none', color: '#fff', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' },
  completedText: { fontSize: 12, color: '#16a34a', fontWeight: 600 },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 1000 },
  modal: { width: '100%', maxWidth: 440, background: '#fff', borderRadius: 10, padding: 18, border: '1px solid #e5e7eb' },
  modalTitle: { margin: '0 0 4px', fontSize: 17, color: '#0f172a' },
  modalSub: { margin: '0 0 14px', fontSize: 13, color: '#64748b' },
  checkboxRow: { display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: '#1f2937', marginBottom: 14 },
  checkbox: { marginTop: 2 },
  modalActions: { display: 'flex', gap: 10, justifyContent: 'flex-end' },
  cancelBtn: { padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, background: '#fff', cursor: 'pointer', fontSize: 12 },
  confirmBtn: { padding: '8px 12px', border: 'none', borderRadius: 6, background: 'var(--theme-accent)', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600 },
};
