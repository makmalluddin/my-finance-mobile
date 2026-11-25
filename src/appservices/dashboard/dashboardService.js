import { dashboardRepository } from '@/data/repositories/dashboardRepository';
import { getDeviceTimezone, toDateKey } from '@/shared/utils/date';

/**
 * Dashboard bersifat read-only. Tanggal dan timezone perangkat dikirim ke RPC
 * agar agregasi tujuh hari memakai batas hari lokal yang sama dengan UI.
 */
export const dashboardService = {
  getDashboard({ today, timezone } = {}) {
    return dashboardRepository.getDashboard({
      today: today ?? toDateKey(new Date()),
      timezone: timezone ?? getDeviceTimezone(),
    });
  },
};

export default dashboardService;
