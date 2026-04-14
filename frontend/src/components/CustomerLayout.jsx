import { useNavigate, NavLink } from 'react-router-dom';
import { useWindowSize } from '../hooks/useWindowSize';

const links = [
  { to: '/customer/dashboard', label: 'Home',      icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { to: '/customer/orders',    label: 'My orders',  icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  { to: '/customer/bills',     label: 'My bills',   icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z' },
  { to: '/customer/profile',   label: 'Profile',    icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
];

export default function CustomerLayout({ children }) {
  const navigate = useNavigate();
  const { isMobile } = useWindowSize();
  const user = getStoredUser();
  const profilePhoto = getStoredProfilePhoto(user);

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f0f9ff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      {/* Top navbar */}
      <nav style={s.nav}>
        <div style={s.navLogo}>AquaFill</div>
        <div style={s.navUser}>
          {profilePhoto ? (
            <img src={profilePhoto} alt="Profile" style={s.avatarImg} />
          ) : (
            <div style={s.avatar}>{(user.name || user.username || 'U').charAt(0).toUpperCase()}</div>
          )}
          {!isMobile && <span style={s.navName}>{user.name || user.username}</span>}
          <button onClick={handleLogout} style={s.logoutBtn}>Logout</button>
        </div>
      </nav>

      <div style={{ display: 'flex', maxWidth: 1100, margin: '0 auto', padding: isMobile ? '16px 12px 80px' : '24px 20px' }}>

        {/* Sidebar — desktop only */}
        {!isMobile && (
          <aside style={s.sidebar}>
            {links.map(link => (
              <NavLink key={link.to} to={link.to} style={({ isActive }) => ({
                ...s.sideLink,
                background: isActive ? '#e0f2fe' : 'transparent',
                color:      isActive ? '#0ea5e9' : '#64748b',
                fontWeight: isActive ? 600 : 400,
              })}>
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
            })}>
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
  nav:          { background: '#fff', borderBottom: '1px solid #e0f2fe', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 },
  navLogo:      { fontSize: 18, fontWeight: 800, color: '#0ea5e9' },
  navUser:      { display: 'flex', alignItems: 'center', gap: 10 },
  avatar:       { width: 32, height: 32, background: '#0ea5e9', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 },
  avatarImg:    { width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: '1px solid #bae6fd' },
  navName:      { fontSize: 13, fontWeight: 500, color: '#374151' },
  logoutBtn:    { padding: '6px 14px', fontSize: 12, background: 'none', border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer', color: '#64748b' },
  sidebar:      { width: 200, marginRight: 24, flexShrink: 0 },
  sideLink:     { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, fontSize: 13, textDecoration: 'none', marginBottom: 4 },
  bottomNav:    { position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #e0f2fe', display: 'flex', justifyContent: 'space-around', padding: '8px 0 4px', zIndex: 100 },
  bottomNavItem:{ display: 'flex', flexDirection: 'column', alignItems: 'center', textDecoration: 'none', flex: 1 },
};
