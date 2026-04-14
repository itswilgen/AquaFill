import { useWindowSize } from '../hooks/useWindowSize';

export default function PageHeader({ title, subtitle }) {
  const { isMobile, isNarrow } = useWindowSize();

  return (
    <div style={{ padding: isMobile ? (isNarrow ? '12px 12px 0' : '16px 16px 0') : '24px 28px 0' }}>
      <h1 style={{ fontSize: isMobile ? (isNarrow ? 16 : 18) : 20, fontWeight: 600, margin: 0 }}>{title}</h1>
      {subtitle && <p style={{ fontSize: isNarrow ? 12 : 13, color: '#888', margin: '4px 0 0' }}>{subtitle}</p>}
    </div>
  );
}
