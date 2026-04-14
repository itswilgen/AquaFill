import { useState } from 'react';
import Sidebar from './Sidebar';
import { useWindowSize } from '../hooks/useWindowSize';

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}');
  } catch {
    return {};
  }
}

export default function Layout({ children }) {
  const { isMobile, isNarrow } = useWindowSize();
  const [menuOpen, setMenuOpen] = useState(false);
  const user = getStoredUser();

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar isMobile={isMobile} isNarrow={isNarrow} open={menuOpen} onClose={() => setMenuOpen(false)} />

      {isMobile && menuOpen && (
        <button
          onClick={() => setMenuOpen(false)}
          style={styles.backdrop}
          aria-label="Close sidebar overlay"
        />
      )}

      <main style={{
        marginLeft: isMobile ? 0 : 200,
        flex: 1,
        minHeight: '100vh',
        background: 'var(--theme-page-bg)',
      }}>
        {isMobile && (
          <header style={{ ...styles.mobileHeader, padding: isNarrow ? '8px 10px' : '10px 14px', gap: isNarrow ? 8 : 10 }}>
            <button style={styles.menuBtn} onClick={() => setMenuOpen(true)} aria-label="Open menu">
              ☰
            </button>
            <div>
              <div style={{ ...styles.mobileTitle, fontSize: isNarrow ? 13 : 14 }}>AquaFill Admin</div>
              <div style={{ ...styles.mobileSub, fontSize: isNarrow ? 10 : 11 }}>{user.name || user.username || 'Account'}</div>
            </div>
          </header>
        )}
        {children}
      </main>
    </div>
  );
}

const styles = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15,23,42,0.35)',
    border: 'none',
    padding: 0,
    margin: 0,
    zIndex: 1200,
    cursor: 'pointer',
  },
  mobileHeader: {
    position: 'sticky',
    top: 0,
    zIndex: 1100,
    background: 'var(--theme-page-bg)',
    borderBottom: '1px solid var(--theme-page-border)',
    padding: '10px 14px',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  menuBtn: {
    width: 34,
    height: 34,
    borderRadius: 6,
    border: '1px solid #d1d5db',
    background: '#fff',
    fontSize: 18,
    lineHeight: '32px',
    cursor: 'pointer',
    color: '#334155',
  },
  mobileTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: '#0f172a',
  },
  mobileSub: {
    fontSize: 11,
    color: '#64748b',
  },
};
