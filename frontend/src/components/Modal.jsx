import { useWindowSize } from '../hooks/useWindowSize';

export default function Modal({ title, onClose, children }) {
  const { isMobile, isNarrow } = useWindowSize();

  return (
    <div style={styles.overlay}>
      <div style={{ ...styles.box, width: isNarrow ? '96vw' : 480, borderRadius: isNarrow ? 8 : 10 }}>
        <div style={{ ...styles.header, padding: isNarrow ? '12px 14px' : '16px 20px' }}>
          <h3 style={{ ...styles.title, fontSize: isNarrow ? 14 : 15 }}>{title}</h3>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>
        <div style={{ ...styles.body, padding: isNarrow ? 14 : 20, paddingBottom: isMobile ? 16 : 20 }}>{children}</div>
      </div>
    </div>
  );
}
    
const styles = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  box:     { background: '#fff', borderRadius: 10, width: 480, maxWidth: '96vw', maxHeight: '90vh', overflow: 'auto' },
  header:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #eee' },
  title:   { margin: 0, fontSize: 15, fontWeight: 600 },
  closeBtn:{ background: 'none', border: 'none', fontSize: 16, color: '#888', cursor: 'pointer' },
  body:    { padding: 20 },
};
