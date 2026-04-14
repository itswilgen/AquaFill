import { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { getOrders } from '../services/api';
import { applyTheme, getStoredTheme } from '../theme';

const links = [
  { to: '/dashboard',  label: 'Dashboard'  },
  { to: '/customers',  label: 'Customers'  },
  { to: '/orders',     label: 'Orders'     },
  { to: '/riders',     label: 'Delivery Riders' },
  { to: '/inventory',  label: 'Inventory'  },
  { to: '/billing',    label: 'Billing'    },
];

export default function Sidebar({ isMobile = false, isNarrow = false, open = false, onClose = () => {} }) {
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState(0);
  const [hasNewOrders, setHasNewOrders] = useState(false);
  const [theme, setTheme] = useState(getStoredTheme);
  const seenOrderIdsRef = useRef(new Set());
  const hasFirstLoadRef = useRef(false);

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    onClose();
    navigate('/login');
  }

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const showOrdersAlert = pendingCount > 0 || hasNewOrders;

  useEffect(() => {
    applyTheme(theme);
    try {
      localStorage.setItem('ui_theme', theme);
    } catch {
      // ignore localStorage access issues
    }
  }, [theme]);

  useEffect(() => {
    let mounted = true;

    async function loadOrders() {
      try {
        const res = await getOrders();
        if (!mounted) return;

        const rows = res?.data?.data || [];
        const pending = rows.filter((order) => String(order.status || '').toLowerCase() === 'pending').length;
        setPendingCount(pending);

        const incomingIds = new Set(rows.map((order) => order.id));
        if (!hasFirstLoadRef.current) {
          seenOrderIdsRef.current = incomingIds;
          hasFirstLoadRef.current = true;
        } else {
          const hasIncomingNewOrder = rows.some((order) => !seenOrderIdsRef.current.has(order.id));
          if (hasIncomingNewOrder) setHasNewOrders(true);
          rows.forEach((order) => seenOrderIdsRef.current.add(order.id));
        }
      } catch {
        // keep sidebar stable if order polling fails
      }
    }

    void loadOrders();
    const intervalId = setInterval(() => {
      void loadOrders();
    }, 5000);

    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, []);

  return (
    <aside style={{
      ...styles.sidebar,
      ...(isMobile ? { ...styles.sidebarMobile, width: isNarrow ? '86vw' : 240 } : styles.sidebarDesktop),
      transform: isMobile ? (open ? 'translateX(0)' : 'translateX(-110%)') : 'none',
    }}>
      <style>{`
        @keyframes sidebarAlertBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.45; }
        }
        @keyframes sidebarAlertPulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(220,38,38,0.45); }
          50% { transform: scale(1.08); box-shadow: 0 0 0 6px rgba(220,38,38,0); }
        }
        .sidebar-alert-blink {
          animation: sidebarAlertBlink 1s linear infinite;
        }
        .sidebar-alert-dot {
          animation: sidebarAlertPulse 1.2s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .sidebar-alert-blink,
          .sidebar-alert-dot {
            animation: none !important;
          }
        }
      `}</style>

      <div style={{ ...styles.logo, padding: isNarrow ? '14px 12px' : '20px 16px 16px' }}>
        <div>
          <p style={{ ...styles.logoTitle, fontSize: isNarrow ? 15 : 16 }}>AquaFill</p>
          <span style={{ ...styles.logoSub, fontSize: isNarrow ? 10 : 11 }}>Water Refilling System</span>
        </div>
        {isMobile && (
          <button style={styles.closeBtn} onClick={onClose} aria-label="Close menu">
            ✕
          </button>
        )}
      </div>

      <nav style={styles.nav}>
        {links.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            onClick={() => {
              if (isMobile) onClose();
              if (link.to === '/orders') setHasNewOrders(false);
            }}
            style={({ isActive }) => ({
              ...styles.navItem,
              ...(isNarrow ? { padding: '9px 12px', fontSize: 12 } : {}),
              ...(isActive ? styles.navActive : {}),
            })}
          >
            <span style={styles.navLabelWrap}>
              <span>{link.label}</span>
              {link.to === '/orders' && showOrdersAlert && (
                <span style={styles.alertWrap}>
                  <span className="sidebar-alert-dot" style={styles.alertDot} />
                  <span className="sidebar-alert-blink" style={styles.alertBadge}>
                    {pendingCount > 0 ? pendingCount : 'New'}
                  </span>
                </span>
              )}
            </span>
          </NavLink>
        ))}
      </nav>

      <div style={{ ...styles.userBox, padding: isNarrow ? 12 : 16 }}>
        <p style={{ ...styles.username, fontSize: isNarrow ? 12 : 13 }}>{user.username || 'admin'}</p>
        <span style={{ ...styles.role, fontSize: isNarrow ? 10 : 11 }}>{user.role || 'Administrator'}</span>
        <button
          onClick={() => setTheme((prev) => (prev === 'green' ? 'blue' : 'green'))}
          style={styles.themeBtn}
        >
          Theme: {theme === 'green' ? 'Green' : 'Blue'}
        </button>
        <button onClick={handleLogout} style={styles.logoutBtn}>
          Logout
        </button>
      </div>
    </aside>
  );
}

const styles = {
  sidebar:    { width: 200, background: '#fff', borderRight: '1px solid #e5e5e5', display: 'flex', flexDirection: 'column', height: '100vh', top: 0, left: 0, zIndex: 1300, transition: 'transform 0.2s ease' },
  sidebarDesktop: { position: 'fixed' },
  sidebarMobile:  { position: 'fixed', width: 240, maxWidth: 240, boxShadow: '0 12px 24px rgba(0,0,0,0.16)' },
  logo:       { padding: '20px 16px 16px', borderBottom: '1px solid #e5e5e5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  logoTitle:  { fontWeight: 600, fontSize: 16, color: '#1a1a1a', margin: 0 },
  logoSub:    { fontSize: 11, color: '#888' },
  closeBtn:   { width: 28, height: 28, borderRadius: 6, border: '1px solid #e5e7eb', background: '#fff', color: '#475569', cursor: 'pointer', fontSize: 13, lineHeight: '26px' },
  nav:        { flex: 1, padding: '8px 0' },
  navItem:    { display: 'block', padding: '10px 16px', fontSize: 13, color: '#555', borderLeft: '3px solid transparent', transition: 'all 0.15s' },
  navLabelWrap: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  alertWrap:  { display: 'inline-flex', alignItems: 'center', gap: 5, flexShrink: 0 },
  alertDot:   { width: 8, height: 8, borderRadius: '50%', background: '#DC2626' },
  alertBadge: { fontSize: 10, fontWeight: 700, color: '#991B1B', background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 999, padding: '1px 6px', lineHeight: 1.2 },
  navActive:  { color: 'var(--theme-accent)', background: 'var(--theme-accent-soft)', borderLeft: '3px solid var(--theme-accent)', fontWeight: 500 },
  userBox:    { padding: 16, borderTop: '1px solid #e5e5e5' },
  username:   { fontSize: 13, fontWeight: 500, margin: '0 0 2px' },
  role:       { fontSize: 11, color: '#888', display: 'block', marginBottom: 8 },
  themeBtn:   { width: '100%', padding: '6px 0', fontSize: 12, marginBottom: 8, background: 'var(--theme-accent-soft)', border: '1px solid var(--theme-accent-border)', borderRadius: 6, color: 'var(--theme-accent)', cursor: 'pointer', fontWeight: 600 },
  logoutBtn:  { width: '100%', padding: '6px 0', fontSize: 12, background: 'none', border: '1px solid #ddd', borderRadius: 6, color: '#555' },
};
