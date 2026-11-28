import { supabase } from '@/data/supabase/client';
import { mapRepositoryError, requireResult, toMoney } from './error-mapper';

/**
 * Data agregasi Dashboard dibaca melalui RPC agar perhitungan Active Balance
 * dan grafik memakai aturan database yang sama dengan pengujian backend.
 */
function mapDashboard(data) {
  const result = requireResult(data);
  const activeFunds = Array.isArray(result.active_funds) ? result.active_funds : [];
  const expenseSeries = Array.isArray(result.expense_series) ? result.expense_series : [];

  return {
    activeBalance: toMoney(result.active_balance),
    totalActiveFundsBalance: toMoney(result.total_active_funds_balance),
    outstandingExpenseAllocation: toMoney(result.outstanding_expense_allocation),
    activeFunds: activeFunds.map((fund) => ({
      id: fund.id,
      name: fund.name,
      balance: toMoney(fund.balance),
    })),
    expenseSeries: expenseSeries.map((point) => ({
      date: point.date,
      total: toMoney(point.total),
    })),
    pendingNotifications: Number(result.pending_notifications ?? 0),
  };
}

export const dashboardRepository = {
  async getDashboard({ today, timezone }) {
    const { data, error } = await supabase.rpc('rpc_get_dashboard', {
      p_today: today,
      p_timezone: timezone,
    });

    if (error) {
      throw mapRepositoryError(error, 'Gagal memuat ringkasan Dashboard.');
    }
    return mapDashboard(data);
  },
};

export default dashboardRepository;
