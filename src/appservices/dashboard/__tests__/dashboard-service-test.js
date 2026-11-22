import { dashboardService } from '@/appservices/dashboard/dashboardService';
import { dashboardRepository } from '@/data/repositories/dashboardRepository';
import { toDateKey } from '@/shared/utils/date';

jest.mock('@/data/repositories/dashboardRepository', () => ({
  dashboardRepository: {
    getDashboard: jest.fn(),
  },
}));

beforeEach(() => {
  jest.resetAllMocks();
});

describe('dashboardService', () => {
  test('mengirim tanggal kalender lokal ke repository', async () => {
    dashboardRepository.getDashboard.mockResolvedValue({ activeBalance: 1000 });

    const today = new Date(2026, 10, 22, 23, 30);
    await dashboardService.getDashboard({ today: toDateKey(today), timezone: 'Asia/Jakarta' });

    expect(dashboardRepository.getDashboard).toHaveBeenCalledWith({
      today: '2026-11-22',
      timezone: 'Asia/Jakarta',
    });
  });

  test('parameter tanggal dan timezone dapat ditimpa untuk pengujian', async () => {
    dashboardRepository.getDashboard.mockResolvedValue({ activeBalance: 0 });

    await dashboardService.getDashboard({ today: '2026-01-01', timezone: 'UTC' });

    expect(dashboardRepository.getDashboard).toHaveBeenCalledWith({
      today: '2026-01-01',
      timezone: 'UTC',
    });
  });
});
