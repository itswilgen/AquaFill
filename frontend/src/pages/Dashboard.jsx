import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import Spinner from '../components/Spinner';
import { getBillSummary, getCustomers, getInventory, getOrders } from '../services/api';
import { useWindowSize } from '../hooks/useWindowSize';

export function StatusBadge({ status }) {
  const key = String(status || 'unknown').toLowerCase();
  const colors = {
    pending:   { bg: '#FEF3C7', color: '#92400E' },
    delivered: { bg: '#EAF3DE', color: '#27500A' },
    completed: { bg: '#EAF3DE', color: '#27500A' },
    paid:      { bg: '#EAF3DE', color: '#27500A' },
    unpaid:    { bg: '#FCEBEB', color: '#791F1F' },
    cancelled: { bg: '#FCEBEB', color: '#791F1F' },
  };
  const c = colors[key] || { bg: 'var(--theme-accent-soft)', color: 'var(--theme-link)' };

  return (
    <span style={{ background: c.bg, color: c.color, padding: '3px 10px', borderRadius: 10, fontSize: 11, fontWeight: 500, textTransform: 'capitalize' }}>
      {key.replace(/_/g, ' ')}
    </span>
  );
}

function MetricCard({ label, value, tone, card = {}, compact = false }) {
  return (
    <div
      className="dash-metric"
      style={{
        ...styles.metric,
        ...(compact ? styles.metricCompactCard : {}),
        ...(card.bg ? { background: card.bg } : {}),
        ...(card.border ? { borderColor: card.border } : {}),
      }}
    >
      <div style={styles.metricTop}>
        <div style={styles.metricHeadText}>
          <p
            style={{
              ...styles.metricLabel,
              ...(compact ? styles.metricLabelCompact : {}),
              ...(card.labelColor ? { color: card.labelColor } : {}),
            }}
          >
            {label}
          </p>
        </div>
      </div>
      <p
        style={{
          ...styles.metricValue,
          ...(compact ? styles.metricValueCompact : {}),
          color: tone || card.valueColor || '#1a1a1a',
        }}
      >
        {value}
      </p>
    </div>
  );
}

export default function Dashboard() {
  const { width, isMobile, isTablet } = useWindowSize();
  const isNarrow = width <= 400;
  const [customers, setCustomers] = useState([]);
  const [orders,    setOrders]    = useState([]);
  const [items,     setItems]     = useState([]);
  const [summary,   setSummary]   = useState({});
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [animateIn, setAnimateIn] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setAnimateIn(true), 60);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let mounted = true;

    async function load({ silent = false } = {}) {
      if (!silent && mounted) setLoading(true);

      try {
        const [customersRes, ordersRes, inventoryRes, summaryRes] = await Promise.all([
          getCustomers(),
          getOrders(),
          getInventory(),
          getBillSummary(),
        ]);

        if (!mounted) return;

        setCustomers(customersRes.data.data || []);
        setOrders(ordersRes.data.data || []);
        setItems(inventoryRes.data.data || []);
        setSummary(summaryRes.data.data || {});
        setLastSyncedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        setError('');
      } catch (err) {
        if (mounted) setError(err?.response?.data?.message || 'Failed to load dashboard data.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();

    const intervalId = setInterval(() => {
      void load({ silent: true });
    }, 5000);

    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, []);

  const pendingOrders = orders.filter(order => order.status === 'pending').length;
  const lowStockItems = items.filter(item => Number(item.quantity) <= Number(item.reorder_level));
  const totalRevenue  = Number(summary.total_revenue || 0).toFixed(2);
  const deliveriesToday = orders.filter(order => {
    const delivery = order.delivery_date?.slice(0, 10);
    if (!delivery) return false;
    const today = new Date().toISOString().slice(0, 10);
    return delivery === today;
  }).length;
  const metricColumns = isNarrow ? '1fr' : isMobile ? '1fr 1fr' : isTablet ? 'repeat(2, minmax(0, 1fr))' : 'repeat(4, minmax(0, 1fr))';
  const panelColumns = isMobile || isTablet ? '1fr' : '1.3fr 1fr';
  const tableMinWidth = isNarrow ? 360 : 420;

  return (
    <Layout>
      <style>{`
        @keyframes dashFadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes dashFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .dash-metric {
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
        }
        .dash-metric:hover {
          transform: translateY(-2px);
          border-color: #dbe5ef;
          box-shadow: 0 10px 22px rgba(15, 23, 42, 0.08);
        }
        .dash-panel {
          transition: transform 0.2s ease;
        }
        .dash-panel:hover {
          transform: translateY(-1px);
        }
        .dash-table-wrap {
          transition: box-shadow 0.2s ease, border-color 0.2s ease;
        }
        .dash-table-wrap:hover {
          border-color: #d8e2ec;
          box-shadow: 0 8px 20px rgba(15, 23, 42, 0.06);
        }
        .dash-row {
          transition: background 0.16s ease;
        }
        .dash-row:hover {
          background: #f8fafc;
        }
        @media (prefers-reduced-motion: reduce) {
          .dash-metric,
          .dash-panel,
          .dash-table-wrap,
          .dash-row {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>

      <PageHeader title="Dashboard" subtitle="Overview of customers, orders, inventory, and billing" />

      <div style={{
        ...styles.content,
        padding: isMobile ? 16 : isTablet ? 20 : 28,
      }}>
        <section style={styles.overviewBar}>
          <div>
            <h2 style={styles.overviewTitle}>Operations Overview</h2>
            <p style={styles.overviewSub}>Live snapshot of daily orders, stock, and revenue.</p>
          </div>
          <div style={styles.overviewMeta}>
            <span style={styles.overviewBadge}>Pending: {pendingOrders}</span>
            <span style={styles.overviewBadgeWarn}>Low stock: {lowStockItems.length}</span>
            <span style={styles.overviewBadgeInfo}>Due today: {deliveriesToday}</span>
            <span style={styles.overviewSync}>Last sync: {lastSyncedAt || '--:--'}</span>
          </div>
        </section>

        {error && <div style={styles.error}>{error}</div>}

        {loading ? <Spinner /> : (
          <>
            <div style={{ ...styles.grid4, gridTemplateColumns: metricColumns }}>
              <div style={animateIn ? { animation: 'dashFadeUp 0.45s ease 0s both' } : undefined}>
                <MetricCard
                  label="Customers"
                  value={customers.length}
                  compact={isNarrow}
                  card={{ bg: 'var(--theme-accent-soft)', border: 'var(--theme-accent-border)', labelColor: '#33516E', valueColor: 'var(--theme-link)' }}
                />
              </div>
              <div style={animateIn ? { animation: 'dashFadeUp 0.45s ease 0.06s both' } : undefined}>
                <MetricCard
                  label="Orders"
                  value={orders.length}
                  tone="var(--theme-accent)"
                  compact={isNarrow}
                  card={{ bg: '#E8FAF7', border: '#B6EADF', labelColor: '#285E58' }}
                />
              </div>
              <div style={animateIn ? { animation: 'dashFadeUp 0.45s ease 0.12s both' } : undefined}>
                <MetricCard
                  label="Pending orders"
                  value={pendingOrders}
                  tone="#92400E"
                  compact={isNarrow}
                  card={{ bg: '#FFF4E5', border: '#F8D7A8', labelColor: '#7A4A16' }}
                />
              </div>
              <div style={animateIn ? { animation: 'dashFadeUp 0.45s ease 0.18s both' } : undefined}>
                <MetricCard
                  label="Revenue"
                  value={`PHP ${totalRevenue}`}
                  tone="#27500A"
                  compact={isNarrow}
                  card={{ bg: '#EAF8EA', border: '#BFE6C0', labelColor: '#2E6040' }}
                />
              </div>
            </div>

            <div style={{ ...styles.columns, gridTemplateColumns: panelColumns }}>
              <section
                className="dash-panel"
                style={{
                  ...styles.panel,
                  ...(animateIn ? { animation: 'dashFadeUp 0.5s ease 0.12s both' } : {}),
                }}
              >
                <div style={styles.panelHeader}>
                  <h2 style={styles.panelTitle}>Recent orders</h2>
                  <span style={styles.panelMeta}>{orders.length} total</span>
                </div>

                <div className="dash-table-wrap" style={styles.tableWrap}>
                  <table style={{ ...styles.table, minWidth: tableMinWidth }}>
                    <thead>
                      <tr style={styles.thead}>
                        <th style={styles.th}>Order</th>
                        <th style={styles.th}>Customer</th>
                        <th style={styles.th}>Qty</th>
                        <th style={styles.th}>Status</th>
                        <th style={styles.th}>Delivery</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.length === 0 ? (
                        <tr>
                          <td colSpan={5} style={styles.empty}>No orders found</td>
                        </tr>
                      ) : orders.slice(0, 6).map((order, index) => (
                        <tr
                          key={order.id}
                          className="dash-row"
                          style={animateIn ? { animation: `dashFadeIn 0.35s ease ${0.2 + (index * 0.04)}s both` } : undefined}
                        >
                          <td style={styles.td}>#{order.id}</td>
                          <td style={styles.td}>{order.customer_name || `Customer #${order.customer_id}`}</td>
                          <td style={styles.td}>{order.quantity}</td>
                          <td style={styles.td}><StatusBadge status={order.status} /></td>
                          <td style={styles.td}>{order.delivery_date?.slice(0, 10) || 'Not set'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section
                className="dash-panel"
                style={{
                  ...styles.panel,
                  ...(animateIn ? { animation: 'dashFadeUp 0.5s ease 0.18s both' } : {}),
                }}
              >
                <div style={styles.panelHeader}>
                  <h2 style={styles.panelTitle}>Low stock</h2>
                  <span style={styles.panelMeta}>{lowStockItems.length} item(s)</span>
                </div>

                <div className="dash-table-wrap" style={styles.tableWrap}>
                  <table style={{ ...styles.table, minWidth: tableMinWidth }}>
                    <thead>
                      <tr style={styles.thead}>
                        <th style={styles.th}>Item</th>
                        <th style={styles.th}>Qty</th>
                        <th style={styles.th}>Reorder</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lowStockItems.length === 0 ? (
                        <tr>
                          <td colSpan={3} style={styles.empty}>Stock levels look good</td>
                        </tr>
                      ) : lowStockItems.slice(0, 6).map((item, index) => (
                        <tr
                          key={item.id}
                          className="dash-row"
                          style={animateIn ? { animation: `dashFadeIn 0.35s ease ${0.24 + (index * 0.04)}s both` } : undefined}
                        >
                          <td style={styles.td}>{item.item_name}</td>
                          <td style={styles.td}>{item.quantity} {item.unit}</td>
                          <td style={styles.td}>{item.reorder_level}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}

const styles = {
  content:     { padding: 28 },
  overviewBar: { background: '#ffffff', border: '1px solid #d9edf3', borderRadius: 8, padding: '14px 16px', marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  overviewTitle: { fontSize: 15, fontWeight: 700, margin: '0 0 2px', color: '#0f172a' },
  overviewSub: { fontSize: 12, margin: 0, color: '#64748b' },
  overviewMeta: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  overviewBadge: { fontSize: 11, fontWeight: 600, color: '#854d0e', background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 999, padding: '3px 8px' },
  overviewBadgeWarn: { fontSize: 11, fontWeight: 600, color: '#7f1d1d', background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 999, padding: '3px 8px' },
  overviewBadgeInfo: { fontSize: 11, fontWeight: 600, color: '#1e3a8a', background: '#dbeafe', border: '1px solid #bfdbfe', borderRadius: 999, padding: '3px 8px' },
  overviewSync: { fontSize: 11, color: '#475569', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 999, padding: '3px 8px' },
  error:       { background: '#FCEBEB', border: '1px solid #F09595', color: '#791F1F', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16 },
  grid4:       { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 14, marginBottom: 24 },
  metric:      { background: '#fff', border: '1px solid #e5e5e5', borderRadius: 8, padding: '16px 18px' },
  metricTop:   { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  metricHeadText: { minWidth: 0 },
  metricCompactCard: { padding: '13px 14px' },
  metricLabel: { fontSize: 12, color: '#888', margin: '0 0 6px' },
  metricLabelCompact: { fontSize: 11 },
  metricValue: { fontSize: 24, fontWeight: 600, margin: 0 },
  metricValueCompact: { fontSize: 20 },
  columns:     { display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 18 },
  panel:       { minWidth: 0 },
  panelHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  panelTitle:  { fontSize: 15, fontWeight: 600, margin: 0, color: '#1a1a1a' },
  panelMeta:   { fontSize: 12, color: '#888' },
  tableWrap:   { background: '#fff', border: '1px solid #e5e5e5', borderRadius: 8, overflow: 'auto' },
  table:       { width: '100%', borderCollapse: 'collapse', minWidth: 420 },
  thead:       { background: '#fafafa' },
  th:          { padding: '10px 12px', textAlign: 'left', fontSize: 11, color: '#888', fontWeight: 500, borderBottom: '1px solid #eee' },
  td:          { padding: '10px 12px', fontSize: 12, borderBottom: '1px solid #f5f5f5', color: '#333' },
  empty:       { textAlign: 'center', padding: 28, color: '#aaa', fontSize: 13 },
};
