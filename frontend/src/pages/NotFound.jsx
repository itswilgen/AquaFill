import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
      <h1 style={{ fontSize: 64, fontWeight: 700, color: '#ddd', margin: 0 }}>404</h1>
      <p style={{ fontSize: 16, color: '#888', margin: '8px 0 24px' }}>Page not found</p>
      <button
        onClick={() => navigate('/dashboard')}
        style={{ padding: '10px 24px', background: '#185FA5', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 500, cursor: 'pointer' }}
      >
        Go to dashboard
      </button>
    </div>
  );
}