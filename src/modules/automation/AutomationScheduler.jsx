import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { automationService } from '@/appservices/automation/automationService';
import { useAuth } from '@/modules/auth';
import { useNotifications } from '@/modules/notifications';

/**
 * Memproses Automation yang jatuh tempo saat aplikasi dibuka dan setiap kali
 * kembali aktif. Komponen ini tidak merender UI dan memakai guard in-flight
 * agar dua pemicu bersamaan tidak menghasilkan pemrosesan ganda.
 */
export default function AutomationScheduler() {
  const { isAuthenticated } = useAuth();
  const { refresh: refreshNotifications } = useNotifications();
  const inFlight = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) {
      return undefined;
    }

    let active = true;

    const run = async () => {
      if (!active || inFlight.current) {
        return;
      }
      inFlight.current = true;
      try {
        await automationService.processDueAutomations();
        if (active) {
          await refreshNotifications();
        }
      } catch {
        // Scheduler tidak boleh mengganggu aplikasi; error tetap tercatat di
        // layar Notifikasi ketika daftar notifikasi dimuat.
      } finally {
        inFlight.current = false;
      }
    };

    run();

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        run();
      }
    });

    return () => {
      active = false;
      subscription.remove();
    };
  }, [isAuthenticated, refreshNotifications]);

  return null;
}
