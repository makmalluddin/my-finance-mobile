import { useCallback, useMemo, useRef, useState } from 'react';
import { automationService } from '@/appservices/automation/automationService';
import { toAppError } from '@/shared/utils/errors';

/**
 * State Automation untuk Presentation Layer. Mutasi selalu melewati
 * automationService dan disegarkan bersama agar jadwal, occurrence, dan
 * template Pocket tetap konsisten.
 */
export function useAutomation() {
  const [automations, setAutomations] = useState([]);
  const [occurrences, setOccurrences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const processInFlight = useRef(false);

  const refresh = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
    }
    setError(null);

    try {
      const [automationData, occurrenceData] = await Promise.all([
        automationService.listAutomations(),
        automationService.listOccurrences({}),
      ]);
      setAutomations(automationData);
      setOccurrences(occurrenceData);
      return automationData;
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

  /**
   * Pemanggilan bersamaan (AppState + fokus layar) hanya menjalankan satu
   * proses. Backend tetap menjadi pengaman idempotency-nya.
   */
  const processDue = useCallback(async () => {
    if (processInFlight.current) {
      return false;
    }
    processInFlight.current = true;
    setProcessing(true);
    try {
      await automationService.processDueAutomations();
      await refresh({ silent: true });
      return true;
    } catch (processError) {
      setError(toAppError(processError).message);
      return false;
    } finally {
      setProcessing(false);
      processInFlight.current = false;
    }
  }, [refresh]);

  const occurrencesByAutomation = useMemo(
    () =>
      occurrences.reduce((groups, occurrence) => {
        if (!occurrence.automationId) {
          return groups;
        }
        const group = groups.get(occurrence.automationId) ?? [];
        group.push(occurrence);
        groups.set(occurrence.automationId, group);
        return groups;
      }, new Map()),
    [occurrences]
  );

  return {
    automations,
    occurrences,
    occurrencesByAutomation,
    loading,
    saving,
    processing,
    error,
    refresh,
    clearError: () => setError(null),
    getAutomationForItem: (pocketItemId) =>
      automations.find((automation) => automation.pocketItemId === pocketItemId) ?? null,
    createAutomation: (input) => runMutation(() => automationService.createAutomation(input)),
    updateAutomation: (input) => runMutation(() => automationService.updateAutomation(input)),
    deleteAutomation: (automationId) =>
      runMutation(() => automationService.deleteAutomation(automationId)),
    processDue,
  };
}

export default useAutomation;
