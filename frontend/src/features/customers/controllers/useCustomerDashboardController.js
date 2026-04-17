import { useEffect, useMemo, useState } from 'react';
import { getServices } from '../../../app/container';

export function useCustomerDashboardController(user) {
  const { customerPortalService } = useMemo(() => getServices(), []);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const rows = await customerPortalService.getOrdersForSessionUser();
        if (!mounted) return;
        setOrders(rows);
      } catch (err) {
        if (!mounted) return;
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();

    return () => {
      mounted = false;
    };
  }, [customerPortalService, user?.name, user?.username]);

  return {
    orders,
    loading,
    error,
  };
}
