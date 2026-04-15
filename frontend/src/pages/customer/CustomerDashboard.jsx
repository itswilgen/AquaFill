import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomerLayout from '../../components/CustomerLayout';
import { useWindowSize } from '../../hooks/useWindowSize';
import { useCustomerDashboardController } from '../../features/customers/controllers/useCustomerDashboardController';

export function StatusBadge({ status }) {
  const map = {
    pending: { bg: '#fef3c7', color: '#92400e' },
    delivered: { bg: '#dcfce7', color: '#166534' },
    cancelled: { bg: '#fee2e2', color: '#991b1b' },
    paid: { bg: '#dcfce7', color: '#166534' },
    unpaid: { bg: '#fee2e2', color: '#991b1b' },
  };

  const key = String(status || '').toLowerCase();
  const label = key ? key.charAt(0).toUpperCase() + key.slice(1) : 'Unknown';
  const st = map[key] || { bg: '#f1f5f9', color: '#64748b' };

  return (
    <span style={{ background: st.bg, color: st.color, padding: '4px 11px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
      {label}
    </span>
  );
}

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const { isMobile, isTablet } = useWindowSize();
  const user = useMemo(() => JSON.parse(localStorage.getItem('user') || '{}'), []);
  const { orders, loading, error } = useCustomerDashboardController(user);

  const pending = orders.filter((o) => o.status === 'pending').length;
  const unpaidAmt = orders.filter((o) => o.bill_status === 'unpaid').reduce((sum, o) => sum + Number(o.amount || 0), 0);

  return (
    <CustomerLayout>
      <style>{`
        .customer-hero-cta:hover {
          transform: translateY(-1px);
          box-shadow: 0 12px 24px rgba(3, 105, 161, 0.25);
        }
        .customer-metric-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 24px rgba(14, 165, 233, 0.14);
        }
        .customer-quick-card:hover {
          transform: translateY(-2px);
          border-color: #7dd3fc !important;
          box-shadow: 0 12px 26px rgba(14, 165, 233, 0.15);
        }
      `}</style>

      <section style={{ ...s.hero, padding: isMobile ? '20px 18px' : '28px 24px' }}>
        <div style={s.heroGlowA} />
        <div style={s.heroGlowB} />
        <div style={s.heroContent}>
          <div>
            <p style={s.heroOverline}>Good day</p>
            <h1 style={{ ...s.heroTitle, fontSize: isMobile ? 22 : 26 }}>
              {user.name || user.username} 👋
            </h1>
            <p style={s.heroSub}>Manage your water orders and payments in one place.</p>
          </div>
          <button
            onClick={() => navigate('/customer/orders')}
            style={s.heroCta}
            className="customer-hero-cta"
          >
            + Place new order
          </button>
        </div>
      </section>

      <section
        style={{
          ...s.metricGrid,
          gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, minmax(0, 1fr))' : 'repeat(3, minmax(0, 1fr))',
        }}
      >
        {[
          { label: 'Total orders', value: orders.length, color: '#0ea5e9', icon: '📦' },
          { label: 'Pending', value: pending, color: '#f97316', icon: '⏳' },
          { label: 'Amount due', value: `₱${unpaidAmt.toFixed(2)}`, color: '#ef4444', icon: '💳' },
        ].map((metric, i) => (
          <div key={i} style={s.metricCard} className="customer-metric-card">
            <div style={s.metricIcon}>{metric.icon}</div>
            <div style={{ ...s.metricValue, color: metric.color }}>{metric.value}</div>
            <div style={s.metricLabel}>{metric.label}</div>
          </div>
        ))}
      </section>

      <section style={s.tableCard}>
        <div style={s.tableHead}>
          <h3 style={s.tableTitle}>Recent orders</h3>
          <button onClick={() => navigate('/customer/orders')} style={s.tableLink}>
            View all
          </button>
        </div>

        {error && <p style={s.errorText}>{error}</p>}

        {loading ? (
          <p style={s.loading}>Loading...</p>
        ) : orders.length === 0 ? (
          <div style={s.emptyWrap}>
            <p style={s.emptyText}>No orders yet.</p>
            <button onClick={() => navigate('/customer/orders')} style={s.emptyBtn}>
              Place your first order
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={s.table}>
              <thead>
                <tr style={s.theadRow}>
                  {['Order', 'Qty', 'Status', 'Amount', 'Bill', 'Date'].map((h) => (
                    <th key={h} style={s.th}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 5).map((o) => (
                  <tr key={o.id}>
                    <td style={s.td}>{o.id}</td>
                    <td style={s.td}>{o.quantity}</td>
                    <td style={s.td}>
                      <StatusBadge status={o.status} />
                    </td>
                    <td style={s.td}>₱{Number(o.amount || 0).toFixed(2)}</td>
                    <td style={s.td}>
                      <StatusBadge status={o.bill_status || 'unpaid'} />
                    </td>
                    <td style={s.td}>{o.created_at?.slice(0, 10)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section
        style={{
          ...s.quickGrid,
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))',
        }}
      >
        {[
          { icon: '📋', title: 'My orders', desc: 'View and track all your water orders', path: '/customer/orders' },
          { icon: '💰', title: 'My bills', desc: 'View and pay your outstanding bills', path: '/customer/bills' },
        ].map((quick, i) => (
          <div key={i} onClick={() => navigate(quick.path)} style={s.quickCard} className="customer-quick-card">
            <div style={s.quickIcon}>{quick.icon}</div>
            <div style={s.quickTitle}>{quick.title}</div>
            <div style={s.quickDesc}>{quick.desc}</div>
          </div>
        ))}
      </section>
    </CustomerLayout>
  );
}

const s = {
  hero: {
    position: 'relative',
    overflow: 'hidden',
    background: 'linear-gradient(135deg, #0ea5e9 0%, #0369a1 65%, #075985 100%)',
    borderRadius: 18,
    marginBottom: 18,
    boxShadow: '0 16px 36px rgba(3,105,161,0.28)',
  },
  heroGlowA: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(255,255,255,0.24) 0%, rgba(255,255,255,0) 70%)',
    top: -120,
    right: -60,
    pointerEvents: 'none',
  },
  heroGlowB: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(56,189,248,0.35) 0%, rgba(56,189,248,0) 72%)',
    bottom: -90,
    left: -40,
    pointerEvents: 'none',
  },
  heroContent: {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
  },
  heroOverline: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.78)',
    margin: '0 0 6px',
    textTransform: 'uppercase',
    letterSpacing: '0.7px',
    fontWeight: 600,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: 800,
    color: '#fff',
    margin: '0 0 8px',
    letterSpacing: '-0.4px',
  },
  heroSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.83)',
    margin: 0,
  },
  heroCta: {
    padding: '10px 20px',
    background: '#fff',
    color: '#0ea5e9',
    border: 'none',
    borderRadius: 11,
    fontWeight: 700,
    fontSize: 13,
    cursor: 'pointer',
    transition: 'all 0.18s ease',
  },
  metricGrid: {
    display: 'grid',
    gap: 14,
    marginBottom: 18,
  },
  metricCard: {
    background: '#fff',
    borderRadius: 14,
    padding: '18px 16px',
    border: '1px solid #dbeafe',
    boxShadow: '0 4px 16px rgba(14,165,233,0.08)',
    transition: 'all 0.2s ease',
  },
  metricIcon: {
    fontSize: 22,
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 800,
    marginBottom: 4,
    letterSpacing: '-0.3px',
  },
  metricLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: 600,
  },
  tableCard: {
    background: '#fff',
    borderRadius: 14,
    padding: 18,
    border: '1px solid #dbeafe',
    boxShadow: '0 5px 20px rgba(14,165,233,0.09)',
    marginBottom: 16,
  },
  tableHead: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  tableTitle: {
    fontSize: 15,
    fontWeight: 800,
    color: '#0c1a2e',
    margin: 0,
  },
  tableLink: {
    fontSize: 12,
    color: '#0284c7',
    background: '#f0f9ff',
    border: '1px solid #bae6fd',
    borderRadius: 8,
    padding: '6px 10px',
    cursor: 'pointer',
    fontWeight: 600,
  },
  loading: {
    textAlign: 'center',
    color: '#94a3b8',
    padding: 22,
  },
  errorText: {
    color: '#b91c1c',
    background: '#fee2e2',
    border: '1px solid #fecaca',
    borderRadius: 9,
    padding: '8px 10px',
    margin: '0 0 10px',
    fontSize: 12,
    fontWeight: 600,
  },
  emptyWrap: {
    textAlign: 'center',
    padding: '30px 0',
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 14,
    marginBottom: 12,
  },
  emptyBtn: {
    padding: '8px 20px',
    background: '#0ea5e9',
    color: '#fff',
    border: 'none',
    borderRadius: 9,
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: 13,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    minWidth: 500,
  },
  theadRow: {
    background: '#f8fafc',
  },
  th: {
    padding: '9px 12px',
    textAlign: 'left',
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: 700,
    borderBottom: '1px solid #e2e8f0',
  },
  td: {
    padding: '11px 12px',
    fontSize: 12,
    borderBottom: '1px solid #f1f5f9',
    color: '#334155',
    fontWeight: 500,
  },
  quickGrid: {
    display: 'grid',
    gap: 14,
  },
  quickCard: {
    background: '#fff',
    borderRadius: 14,
    padding: 20,
    border: '1px solid #dbeafe',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 16px rgba(14,165,233,0.08)',
  },
  quickIcon: {
    fontSize: 28,
    marginBottom: 10,
  },
  quickTitle: {
    fontSize: 14,
    fontWeight: 800,
    color: '#0c1a2e',
    marginBottom: 5,
  },
  quickDesc: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 1.6,
  },
};
