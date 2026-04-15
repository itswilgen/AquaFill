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
};
