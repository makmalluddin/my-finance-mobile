import {
  automationService,
  nextScheduleDate,
} from '@/appservices/automation/automationService';
import { automationRepository } from '@/data/repositories/automationRepository';

jest.mock('@/data/repositories/automationRepository', () => ({
  automationRepository: {
    listAutomations: jest.fn(),
    listOccurrences: jest.fn(),
    createAutomation: jest.fn(),
    updateAutomation: jest.fn(),
    deleteAutomation: jest.fn(),
    processDueAutomations: jest.fn(),
    confirmOccurrence: jest.fn(),
    rejectOccurrence: jest.fn(),
  },
}));

const VALID_INPUT = {
  pocketId: 'pocket-1',
  name: 'Gaji bulanan',
  amount: 5000000,
  fundId: 'fund-1',
  frequency: 'monthly',
  startDate: '2026-11-25',
  timezone: 'Asia/Jakarta',
};

beforeEach(() => {
  jest.resetAllMocks();
});

describe('automationService', () => {
  test('createAutomation meneruskan payload kontrak ke repository', async () => {
    automationRepository.createAutomation.mockResolvedValue({ id: 'automation-1' });

    await expect(automationService.createAutomation(VALID_INPUT)).resolves.toEqual({
      id: 'automation-1',
    });
    expect(automationRepository.createAutomation).toHaveBeenCalledWith({
      pocketId: 'pocket-1',
      name: 'Gaji bulanan',
      amount: 5000000,
      fundId: 'fund-1',
      frequency: 'monthly',
      startDate: '2026-11-25',
      timezone: 'Asia/Jakarta',
    });
  });

  test('createAutomation memakai timezone perangkat jika tidak diberikan', async () => {
    automationRepository.createAutomation.mockResolvedValue({ id: 'automation-1' });

    const withoutTimezone = { ...VALID_INPUT };
    delete withoutTimezone.timezone;
    await automationService.createAutomation(withoutTimezone);

    expect(automationRepository.createAutomation.mock.calls[0][0].timezone).toBeTruthy();
  });

  test('menolak frekuensi dan nominal yang tidak valid', () => {
    expect(() =>
      automationService.createAutomation({ ...VALID_INPUT, frequency: 'daily' })
    ).toThrow('Frekuensi Automation tidak valid.');
    expect(() =>
      automationService.createAutomation({ ...VALID_INPUT, amount: 0 })
    ).toThrow('Nominal harus lebih besar dari nol.');
    expect(() =>
      automationService.createAutomation({ ...VALID_INPUT, amount: 1000.555 })
    ).toThrow('Nominal maksimal dua angka desimal.');
    expect(automationRepository.createAutomation).not.toHaveBeenCalled();
  });

  test('confirm Occurrence Income menolak nominal kustom', () => {
    expect(() =>
      automationService.confirmOccurrence({
        occurrenceId: 'occurrence-1',
        fundId: 'fund-1',
        pocketType: 'income',
        amount: 1000,
      })
    ).toThrow('Nominal Income mengikuti template dan tidak dapat diubah.');
    expect(automationRepository.confirmOccurrence).not.toHaveBeenCalled();
  });

  test('confirm Occurrence Income meneruskan nominal null', async () => {
    automationRepository.confirmOccurrence.mockResolvedValue({ id: 'transaction-1' });

    await automationService.confirmOccurrence({
      occurrenceId: 'occurrence-1',
      fundId: 'fund-1',
      pocketType: 'income',
      amount: null,
    });

    expect(automationRepository.confirmOccurrence).toHaveBeenCalledWith({
      occurrenceId: 'occurrence-1',
      fundId: 'fund-1',
      amount: null,
    });
  });

  test('confirm Occurrence Expense meneruskan nominal kustom', async () => {
    automationRepository.confirmOccurrence.mockResolvedValue({ id: 'transaction-1' });

    await automationService.confirmOccurrence({
      occurrenceId: 'occurrence-1',
      fundId: 'fund-1',
      pocketType: 'expense',
      amount: 125000,
    });

    expect(automationRepository.confirmOccurrence).toHaveBeenCalledWith({
      occurrenceId: 'occurrence-1',
      fundId: 'fund-1',
      amount: 125000,
    });
  });
});

describe('nextScheduleDate', () => {
  test('weekly mengambil periode berikutnya setelah tanggal acuan', () => {
    expect(
      nextScheduleDate('2026-11-02', 'weekly', '2026-11-02').toDateString()
    ).toBe(new Date(2026, 10, 9).toDateString());
    expect(
      nextScheduleDate('2026-11-02', 'weekly', '2026-11-10').toDateString()
    ).toBe(new Date(2026, 10, 16).toDateString());
  });

  test('every_two_weeks mengambil 14 hari setelah tanggal mulai', () => {
    expect(
      nextScheduleDate('2026-11-02', 'every_two_weeks', '2026-11-02').toDateString()
    ).toBe(new Date(2026, 10, 16).toDateString());
  });

  test('monthly memakai hari terakhir bulan untuk tanggal 31', () => {
    expect(
      nextScheduleDate('2026-01-31', 'monthly', '2026-01-31').toDateString()
    ).toBe(new Date(2026, 1, 28).toDateString());
    expect(
      nextScheduleDate('2026-01-31', 'monthly', '2026-02-28').toDateString()
    ).toBe(new Date(2026, 2, 31).toDateString());
  });

  test('tanggal sebelum start mengembalikan tanggal mulai', () => {
    expect(
      nextScheduleDate('2026-11-25', 'monthly', '2026-11-01').toDateString()
    ).toBe(new Date(2026, 10, 25).toDateString());
  });
});
