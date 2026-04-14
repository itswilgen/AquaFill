import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomerLayout from '../../components/CustomerLayout';
import { getOrdersByCustomer, searchCustomers } from '../../services/api';

export function StatusBadge({ status }) {
  const map = {
    pending:   { bg: '#fef3c7', color: '#92400e' },
    delivered: { bg: '#dcfce7', color: '#166534' },
    cancelled: { bg: '#fee2e2', color: '#991b1b' },
    paid:      { bg: '#dcfce7', color: '#166534' },
    unpaid:    { bg: '#fee2e2', color: '#991b1b' },
  };
  const st = map[status] || { bg: '#f1f5f9', color: '#64748b' };
  return (
    <span style={{ background: st.bg, color: st.color, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
      {status}
    </span>
  );
}

export default function CustomerDashboard() {
  const navigate  = useNavigate();
  const user      = JSON.parse(localStorage.getItem('user') || '{}');
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await searchCustomers(user.name || user.username || '');
        const customers = res.data.data;
        if (customers.length > 0) {
          const ordersRes = await getOrdersByCustomer(customers[0].id);
          setOrders(ordersRes.data.data);
        }
      } catch { }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const pending  = orders.filter(o => o.status === 'pending').length;
  const unpaidAmt = orders.filter(o => o.bill_status === 'unpaid').reduce((s, o) => s + Number(o.amount || 0), 0);

  return (
    <CustomerLayout>
      <div style={{ background: 'linear-gradient(135deg, #0ea5e9, #0369a1)', borderRadius: 16, padding: '28px 24px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', margin: '0 0 4px' }}>Good day,</p>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: '0 0 6px', letterSpacing: '-0.5px' }}>{user.name || user.username} 👋</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', margin: 0 }}>Manage your water orders and payments here.</p>
        </div>
        <button onClick={() => navigate('/customer/orders')} style={{ padding: '10px 20px', background: '#fff', color: '#0ea5e9', border: 'none', borderRadius: 10, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
          + Place new order
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Total orders', value: orders.length, color: '#0ea5e9', icon: '📦' },
          { label: 'Pending',      value: pending,        color: '#f97316', icon: '⏳' },
          { label: 'Amount due',   value: `₱${unpaidAmt.toFixed(2)}`, color: '#ef4444', icon: '💳' },
        ].map((m, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 14, padding: '20px 18px', border: '1px solid #e0f2fe', textAlign: 'center' }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{m.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: m.color, marginBottom: 4 }}>{m.value}</div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>{m.label}</div>
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: 14, padding: 20, border: '1px solid #e0f2fe', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0c1a2e', margin: 0 }}>Recent orders</h3>
          <button onClick={() => navigate('/customer/orders')} style={{ fontSize: 12, color: '#0ea5e9', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>View all</button>
        </div>
        {loading ? <p style={{ textAlign: 'center', color: '#94a3b8', padding: 20 }}>Loading...</p> :
         orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 12 }}>No orders yet.</p>
            <button onClick={() => navigate('/customer/orders')} style={{ padding: '8px 20px', background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Place your first order</button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 480 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Order #','Qty','Status','Amount','Bill','Date'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, color: '#94a3b8', fontWeight: 600, borderBottom: '1px solid #f1f5f9' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 5).map(o => (
                  <tr key={o.id}>
                    <td style={{ padding: '10px 12px', fontSize: 12, borderBottom: '1px solid #f8fafc', color: '#374151' }}>#{o.id}</td>
                    <td style={{ padding: '10px 12px', fontSize: 12, borderBottom: '1px solid #f8fafc', color: '#374151' }}>{o.quantity}</td>
                    <td style={{ padding: '10px 12px', fontSize: 12, borderBottom: '1px solid #f8fafc' }}><StatusBadge status={o.status} /></td>
                    <td style={{ padding: '10px 12px', fontSize: 12, borderBottom: '1px solid #f8fafc', color: '#374151' }}>₱{Number(o.amount || 0).toFixed(2)}</td>
                    <td style={{ padding: '10px 12px', fontSize: 12, borderBottom: '1px solid #f8fafc' }}><StatusBadge status={o.bill_status || 'unpaid'} /></td>
                    <td style={{ padding: '10px 12px', fontSize: 12, borderBottom: '1px solid #f8fafc', color: '#374151' }}>{o.created_at?.slice(0, 10)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {[
          { icon: '📋', title: 'My orders', desc: 'View and track all your water orders', path: '/customer/orders' },
          { icon: '💰', title: 'My bills',  desc: 'View and pay your outstanding bills',  path: '/customer/bills' },
        ].map((q, i) => (
          <div key={i} onClick={() => navigate(q.path)} style={{ background: '#fff', borderRadius: 14, padding: 20, border: '1px solid #e0f2fe', cursor: 'pointer' }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>{q.icon}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0c1a2e', marginBottom: 4 }}>{q.title}</div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>{q.desc}</div>
          </div>
        ))}
      </div>
    </CustomerLayout>
  );
}
