import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Landing           from './pages/Landing';
import Login             from './pages/Login';
import Signup            from './pages/Signup';
import Dashboard         from './pages/Dashboard';
import Customers         from './pages/Customers';
import Orders            from './pages/Orders';
import Riders            from './pages/Riders';
import Inventory         from './pages/Inventory';
import Billing           from './pages/Billing';
import NotFound          from './pages/NotFound';
import RiderDashboard    from './pages/RiderDashboard';
import CustomerDashboard from './pages/customer/CustomerDashboard';
import CustomerOrders    from './pages/customer/CustomerOrders';
import CustomerBills     from './pages/customer/CustomerBills';
import CustomerProfile   from './pages/customer/CustomerProfile';
import WaterBubbles      from './components/WaterBubbles';
import {
  getRoleHomeRoute,
  getStoredUserSafe,
  isAuthenticated,
} from './features/auth/controllers/routeGuards';

const buildRef = (
  import.meta.env.VITE_APP_VERSION ||
  import.meta.env.VERCEL_GIT_COMMIT_SHA ||
  'local'
).slice(0, 7);
const deployEnv = import.meta.env.VERCEL_ENV || 'local';

function AdminRoute({ children }) {
  const user = getStoredUserSafe();
  if (!isAuthenticated()) return <Navigate to="/login" />;
  if (user.role !== 'admin' && user.role !== 'staff') {
    return <Navigate to={getRoleHomeRoute(user.role)} />;
  }
  return children;
}

function RiderRoute({ children }) {
  const user = getStoredUserSafe();
  if (!isAuthenticated()) return <Navigate to="/login" />;
  if (user.role !== 'rider') {
    return <Navigate to={getRoleHomeRoute(user.role)} />;
  }
  return children;
}

function PrivateRoute({ children }) {
  return isAuthenticated() ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <div style={styles.shell}>
        <WaterBubbles />
        <div style={styles.buildBadge} title="Build identifier">
          Build {buildRef} ({deployEnv})
        </div>
        <div style={styles.routesLayer}>
          <Routes>
            <Route path="/"       element={<Landing />} />
            <Route path="/login"  element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            <Route path="/dashboard" element={<AdminRoute><Dashboard /></AdminRoute>} />
            <Route path="/customers" element={<AdminRoute><Customers /></AdminRoute>} />
            <Route path="/orders"    element={<AdminRoute><Orders /></AdminRoute>} />
            <Route path="/riders"    element={<AdminRoute><Riders /></AdminRoute>} />
            <Route path="/inventory" element={<AdminRoute><Inventory /></AdminRoute>} />
            <Route path="/billing"   element={<AdminRoute><Billing /></AdminRoute>} />
            <Route path="/rider/dashboard" element={<RiderRoute><RiderDashboard /></RiderRoute>} />

            <Route path="/customer/dashboard" element={<PrivateRoute><CustomerDashboard /></PrivateRoute>} />
            <Route path="/customer/orders"    element={<PrivateRoute><CustomerOrders /></PrivateRoute>} />
            <Route path="/customer/bills"     element={<PrivateRoute><CustomerBills /></PrivateRoute>} />
            <Route path="/customer/profile"   element={<PrivateRoute><CustomerProfile /></PrivateRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

const styles = {
  shell: { position: 'relative', minHeight: '100vh' },
  routesLayer: { position: 'relative', zIndex: 2 },
  buildBadge: {
    position: 'fixed',
    right: 12,
    bottom: 12,
    zIndex: 50,
    padding: '6px 10px',
    borderRadius: 999,
    fontSize: 12,
    letterSpacing: 0.2,
    background: 'rgba(15, 23, 42, 0.72)',
    color: '#f8fafc',
    border: '1px solid rgba(148, 163, 184, 0.3)',
    backdropFilter: 'blur(4px)',
  },
};
