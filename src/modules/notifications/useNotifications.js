import { useCallback, useEffect, useState } from 'react';
import { automationService } from '@/appservices/automation/automationService';
import { notificationService } from '@/appservices/notification/notificationService';
import { toAppError } from '@/shared/utils/errors';
import {
  getPendingNotifications,
  setPendingNotifications,
  subscribePendingNotifications,
} from './notificationStore';

/**
 * State notifikasi yang dipakai bersama layar Notifikasi, tombol Notifikasi
 * di Dashboard, dan scheduler. Scheduler memperbarui store sehingga semua
 * tampilan sinkron.
 */
export function useNotifications() {
  const [notifications, setNotifications] = useState(getPendingNotifications());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => subscribePendingNotifications(() => setNotifications(getPendingNotifications())), []);

  const refresh = useCallback(async () => {
    try {
      const data = await notificationService.listPendingNotifications();
      setPendingNotifications(data);
      setError(null);
      return data;
    } catch (refreshError) {
      setError(toAppError(refreshError).message);
      return getPendingNotifications();
    }
  }, []);

  const runMutation = useCallback(
    async (mutation) => {
      setSaving(true);
      setError(null);
      try {
        await mutation();
        await refresh();
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
    notifications,
    saving,
    error,
    refresh,
    clearError: () => setError(null),
    confirmOccurrence: (input) => runMutation(() => automationService.confirmOccurrence(input)),
    rejectOccurrence: (occurrenceId) =>
      runMutation(() => automationService.rejectOccurrence(occurrenceId)),
  };
}

export default useNotifications;
