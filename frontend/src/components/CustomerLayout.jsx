import { useNavigate, NavLink } from 'react-router-dom';
import { useWindowSize } from '../hooks/useWindowSize';
import { getAuthService } from '../app/container';

const links = [
  { to: '/customer/dashboard', label: 'Home',      icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { to: '/customer/orders',    label: 'My orders',  icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  { to: '/customer/bills',     label: 'My bills',   icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z' },
  { to: '/customer/profile',   label: 'Profile',    icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
];

export default function CustomerLayout({ children }) {
  const navigate = useNavigate();
  const { isMobile, isTablet } = useWindowSize();
  const authService = getAuthService();
  const user = getStoredUser();
  const profilePhoto = getStoredProfilePhoto(user);
  const displayName = user.name || user.username || 'Customer';

  function handleLogout() {
    authService.logout();
    navigate('/login');
  }

  return (
    <div className="customer-shell" style={s.page}>
      <style>{`
        .customer-side-link:hover {
          background: #f0f9ff !important;
          color: #0284c7 !important;
          transform: translateX(2px);
        }
        .customer-logout-btn:hover {
          background: #fee2e2 !important;
          border-color: #fecaca !important;
          color: #dc2626 !important;
        }
        .customer-mobile-link:hover {
          color: #0284c7 !important;
          transform: translateY(-1px);
        }
      `}</style>

      {/* Top navbar */}
      <nav style={s.nav}>
        <div>
          <div style={s.navLogo}>AquaFill</div>
          {!isMobile && <div style={s.navLogoSub}>Water Refilling System</div>}
        </div>
        <div style={s.navUser}>
          {profilePhoto ? (
            <img src={profilePhoto} alt="Profile" style={s.avatarImg} />
          ) : (
            <div style={s.avatar}>{(user.name || user.username || 'U').charAt(0).toUpperCase()}</div>
          )}
          {!isMobile && <span style={s.navName}>{displayName}</span>}
          <button onClick={handleLogout} style={s.logoutBtn} className="customer-logout-btn">Logout</button>
        </div>
      </nav>

      <div style={{
        display: 'flex',
        maxWidth: isTablet ? 1000 : 1160,
        margin: '0 auto',
        padding: isMobile ? '14px 12px 84px' : '28px 20px',
      }}>

        {/* Sidebar — desktop only */}
        {!isMobile && (
          <aside style={s.sidebar}>
            {links.map(link => (
              <NavLink key={link.to} to={link.to} style={({ isActive }) => ({
                ...s.sideLink,
                background: isActive ? '#e0f2fe' : 'transparent',
                color:      isActive ? '#0284c7' : '#64748b',
                fontWeight: isActive ? 700 : 500,
                boxShadow:  isActive ? 'inset 0 0 0 1px #bae6fd' : 'none',
              })} className="customer-side-link">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d={link.icon}/>
                </svg>
                {link.label}
              </NavLink>
            ))}
          </aside>
        )}

        {/* Main content */}
        <main style={{ flex: 1, minWidth: 0 }}>
          {children}
        </main>
      </div>

      {/* Bottom nav — mobile only */}
      {isMobile && (
        <div style={s.bottomNav}>
          {links.map(link => (
            <NavLink key={link.to} to={link.to} style={({ isActive }) => ({
              ...s.bottomNavItem,
              color: isActive ? '#0ea5e9' : '#94a3b8',
            })} className="customer-mobile-link">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d={link.icon}/>
              </svg>
              <span style={{ fontSize: 10, marginTop: 2 }}>{link.label}</span>
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}');
  } catch {
    return {};
  }
}

function getStoredProfilePhoto(user) {
  const fallback = user?.profile_photo || '';
  const keyBase = user?.username || user?.name || '';
  if (!keyBase) return fallback;

  const saved = localStorage.getItem(`customer_profile_photo_${keyBase}`);
  return saved || fallback;
}

const s = {
  page:         { minHeight: '100vh', background: 'linear-gradient(180deg, #f0f9ff 0%, #f8fbff 52%, #eef7ff 100%)', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
  nav:          { background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)', borderBottom: '1px solid #dbeafe', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 4px 16px rgba(14,165,233,0.08)' },
  navLogo:      { fontSize: 18, fontWeight: 800, color: '#0ea5e9' },
  navLogoSub:   { fontSize: 11, color: '#64748b', marginTop: 1 },
  navUser:      { display: 'flex', alignItems: 'center', gap: 10, background: '#f8fbff', border: '1px solid #e2e8f0', borderRadius: 999, padding: '4px 8px 4px 4px' },
  avatar:       { width: 32, height: 32, background: '#0ea5e9', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 },
  avatarImg:    { width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: '1px solid #93c5fd' },
  navName:      { fontSize: 13, fontWeight: 600, color: '#334155' },
  logoutBtn:    { padding: '6px 14px', fontSize: 12, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 999, cursor: 'pointer', color: '#64748b', fontWeight: 600 },
  sidebar:      { width: 212, marginRight: 24, flexShrink: 0, background: '#fff', border: '1px solid #dbeafe', borderRadius: 16, padding: 10, height: 'fit-content', position: 'sticky', top: 92, boxShadow: '0 12px 30px rgba(14,165,233,0.08)' },
  sideLink:     { display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 12, fontSize: 13, textDecoration: 'none', marginBottom: 5, transition: 'all 0.18s ease' },
  bottomNav:    { position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(8px)', borderTop: '1px solid #dbeafe', display: 'flex', justifyContent: 'space-around', padding: '8px 0 calc(4px + env(safe-area-inset-bottom))', zIndex: 100, boxShadow: '0 -6px 20px rgba(15,23,42,0.08)' },
  bottomNavItem:{ display: 'flex', flexDirection: 'column', alignItems: 'center', textDecoration: 'none', flex: 1, fontWeight: 600, transition: 'all 0.16s ease' },
};
