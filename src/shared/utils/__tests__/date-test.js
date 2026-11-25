import {
  formatDateInTimeZone,
  fromDateKey,
  getDeviceTimezone,
  occurredAtToDateKey,
  toDateKey,
  toOccurredAt,
} from '../date';

describe('date helpers', () => {
  test.each(['2026-01-01', '2026-02-28', '2026-11-21', '2026-12-31'])(
    'round trip lokal %s melalui occurred_at',
    (key) => {
      const occurredAt = toOccurredAt(key);
      expect(typeof occurredAt).toBe('string');
      expect(occurredAt.endsWith('Z')).toBe(true);
      expect(occurredAtToDateKey(occurredAt)).toBe(key);
      expect(toDateKey(fromDateKey(key))).toBe(key);
    }
  );

  test('menolak tanggal kalender yang tidak valid', () => {
    expect(fromDateKey('2026-02-30')).toBeNull();
    expect(occurredAtToDateKey('bukan-tanggal')).toBeNull();
    expect(() => toOccurredAt('2026-02-30')).toThrow('INVALID_DATE');
  });

  test('memformat tanggal sesuai zona waktu yang tersimpan', () => {
    expect(formatDateInTimeZone('2026-11-21T00:00:00.000Z', 'Asia/Jakarta')).toBe('21 Nov 2026');
    expect(formatDateInTimeZone('2026-11-20T17:00:00.000Z', 'Pacific/Honolulu')).toBe(
      '20 Nov 2026'
    );
    expect(formatDateInTimeZone('invalid', 'Asia/Jakarta')).toBe('-');
  });

  test('zona waktu perangkat memiliki fallback', () => {
    expect(typeof getDeviceTimezone()).toBe('string');
    expect(getDeviceTimezone().length).toBeGreaterThan(0);
  });
});
