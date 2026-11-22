import { useCallback, useState } from 'react';
import { dashboardService } from '@/appservices/dashboard/dashboardService';
import { toAppError } from '@/shared/utils/errors';

const EMPTY_DASHBOARD = {
  activeBalance: 0,
  totalActiveFundsBalance: 0,
  outstandingExpenseAllocation: 0,
  activeFunds: [],
  expenseSeries: [],
  pendingNotifications: 0,
};

export function useDashboard() {
  const [dashboard, setDashboard] = useState(EMPTY_DASHBOARD);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
    }
    setError(null);

    try {
      const data = await dashboardService.getDashboard();
      setDashboard(data ?? EMPTY_DASHBOARD);
      return data;
    } catch (loadError) {
      setError(toAppError(loadError).message);
      return null;
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  return {
    dashboard,
    loading,
    error,
    refresh,
    clearError: () => setError(null),
  };
}

export default useDashboard;
