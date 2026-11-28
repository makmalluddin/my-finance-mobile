import { useCallback, useState } from 'react';
import { transactionService } from '@/appservices/transaction/transactionService';
import { toAppError } from '@/shared/utils/errors';

const DEFAULT_FILTERS = { type: 'all', range: 'all' };

/**
 * State riwayat dan aksi transaksi. Filter disimpan di sini agar setiap
 * mutasi langsung menyegarkan daftar dengan filter aktif yang sama.
 */
export function useTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) {
        setLoading(true);
      }
      setError(null);

      try {
        const data = await transactionService.listTransactions(filters);
        setTransactions(data);
        return data;
      } catch (loadError) {
        setError(toAppError(loadError).message);
        return [];
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [filters]
  );

  const runMutation = useCallback(
    async (mutation) => {
      setSaving(true);
      setError(null);

      try {
        await mutation();
        await refresh({ silent: true });
        return true;
      } catch (mutationError) {
        setError(toAppError(mutationError).message);
        return false;
      } finally {
        setSaving(false);
      }
    },
    [refresh]
  );

  return {
    transactions,
    filters,
    setFilters,
    loading,
    saving,
    error,
    refresh,
    clearError: () => setError(null),
    createTransaction: (input) => runMutation(() => transactionService.createTransaction(input)),
    updateTransaction: (input) => runMutation(() => transactionService.updateTransaction(input)),
    deleteTransaction: (transactionId) =>
      runMutation(() => transactionService.deleteTransaction(transactionId)),
  };
}

export default useTransactions;
