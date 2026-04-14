export function Toast({ toast }) {
  if (!toast) return null;

  const colors = {
    success: { bg: '#EAF3DE', color: '#27500A', border: '#C0DD97' },
    error:   { bg: '#FCEBEB', color: '#791F1F', border: '#F09595' },
    info:    { bg: '#E6F1FB', color: '#0C447C', border: '#85B7EB' },
  };
  const c = colors[toast.type] || colors.success;

  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24,
      background: c.bg, color: c.color,
      border: `1px solid ${c.border}`,
      padding: '12px 20px', borderRadius: 8,
      fontSize: 13, fontWeight: 500,
      zIndex: 9999, maxWidth: 320,
      animation: 'slideIn 0.2s ease'
    }}>
      {toast.message}
      <style>{`@keyframes slideIn { from { opacity:0; transform:translateY(8px);} to {opacity:1; transform:translateY(0);}}`}</style>
    </div>
  );
}