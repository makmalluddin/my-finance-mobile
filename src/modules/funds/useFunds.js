import { useCallback, useState } from 'react';
import { fundService } from '@/appservices/fund/fundService';
import { toAppError } from '@/shared/utils/errors';

/**
 * State dan aksi Fund untuk Presentation Layer. UI hanya memanggil service;
 * pengambilan saldo dan mutasi tetap dijalankan RPC di backend.
 */
export function useFunds() {
  const [funds, setFunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
    }
    setError(null);

    try {
      const data = await fundService.listFunds({ includeArchived: true });
      setFunds(data);
      return data;
    } catch (loadError) {
      setError(toAppError(loadError).message);
      return [];
    } finally {
      // `silent` hanya meniadakan indikator awal; status loading tetap harus
      // selesai agar pemanggil tidak mengira data masih dimuat selamanya.
      setLoading(false);
    }
  }, []);

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
    funds,
    loading,
    saving,
    error,
    refresh,
    clearError: () => setError(null),
    createFund: (input) => runMutation(() => fundService.createFund(input)),
    updateFund: (input) => runMutation(() => fundService.updateFund(input)),
    archiveFund: (fundId) => runMutation(() => fundService.archiveFund(fundId)),
    unarchiveFund: (fundId) => runMutation(() => fundService.unarchiveFund(fundId)),
    deleteFund: (fundId) => runMutation(() => fundService.deleteFund(fundId)),
  };
}

export default useFunds;
