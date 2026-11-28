import { useCallback, useMemo, useState } from 'react';
import { pocketService } from '@/appservices/pocket/pocketService';
import { toAppError } from '@/shared/utils/errors';

/**
 * State Pocket untuk Presentation Layer. Seluruh mutasi lewat pocketService;
 * setelah mutasi berhasil daftar, item, ringkasan, dan alokasi disegarkan
 * bersama agar angka di Pocket dan Dashboard tetap konsisten.
 */
export function usePockets() {
  const [pockets, setPockets] = useState([]);
  const [items, setItems] = useState([]);
  const [summaries, setSummaries] = useState([]);
  const [allocation, setAllocation] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
    }
    setError(null);

    try {
      const [pocketData, itemData, summaryData, allocationData] = await Promise.all([
        pocketService.listPockets(),
        pocketService.listPocketItems({}),
        pocketService.listTransferSummaries(),
        pocketService.getOutstandingAllocation(),
      ]);
      setPockets(pocketData);
      setItems(itemData);
      setSummaries(summaryData);
      setAllocation(allocationData);
      return pocketData;
    } catch (loadError) {
      setError(toAppError(loadError).message);
      return [];
    } finally {
      if (!silent) {
        setLoading(false);
      }
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

  const itemsByPocket = useMemo(
    () =>
      items.reduce((groups, item) => {
        const group = groups.get(item.pocketId) ?? [];
        group.push(item);
        groups.set(item.pocketId, group);
        return groups;
      }, new Map()),
    [items]
  );

  const summaryByPocket = useMemo(
    () => new Map(summaries.map((summary) => [summary.pocketId, summary])),
    [summaries]
  );

  return {
    pockets,
    items,
    itemsByPocket,
    summaryByPocket,
    allocation,
    loading,
    saving,
    error,
    refresh,
    clearError: () => setError(null),
    getPocket: (pocketId) => pockets.find((pocket) => pocket.id === pocketId) ?? null,
    createPocket: (input) => runMutation(() => pocketService.createPocket(input)),
    updatePocket: (input) => runMutation(() => pocketService.updatePocket(input)),
    archivePocket: (pocketId) => runMutation(() => pocketService.archivePocket(pocketId)),
    unarchivePocket: (pocketId) => runMutation(() => pocketService.unarchivePocket(pocketId)),
    deletePocket: (pocketId) => runMutation(() => pocketService.deletePocket(pocketId)),
    createIncomeItem: (input) => runMutation(() => pocketService.createIncomeItem(input)),
    confirmIncomeItem: (input) => runMutation(() => pocketService.confirmIncomeItem(input)),
    createPlannedExpenseItem: (input) =>
      runMutation(() => pocketService.createPlannedExpenseItem(input)),
    updatePlannedExpenseItem: (input) =>
      runMutation(() => pocketService.updatePlannedExpenseItem(input)),
    convertPlannedExpense: (input) => runMutation(() => pocketService.convertPlannedExpense(input)),
    createTransferItem: (input) => runMutation(() => pocketService.createTransferItem(input)),
    deletePocketItem: (itemId) => runMutation(() => pocketService.deletePocketItem(itemId)),
    updatePocketTransaction: (input) =>
      runMutation(() => pocketService.updatePocketTransaction(input)),
    deletePocketTransaction: (transactionId) =>
      runMutation(() => pocketService.deletePocketTransaction(transactionId)),
  };
}

export default usePockets;
