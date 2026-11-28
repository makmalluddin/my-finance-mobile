import { getGreeting } from '@/modules/dashboard/greeting';

function atHour(hour, minute = 0) {
  return new Date(2026, 10, 28, hour, minute, 0);
}

describe('getGreeting', () => {
  test.each([
    [4, 59, 'Good evening'],
    [5, 0, 'Good morning'],
    [11, 59, 'Good morning'],
    [12, 0, 'Good afternoon'],
    [17, 59, 'Good afternoon'],
    [18, 0, 'Good evening'],
    [23, 59, 'Good evening'],
    [0, 0, 'Good evening'],
  ])('jam %i:%i menghasilkan %s', (hour, minute, expected) => {
    expect(getGreeting(atHour(hour, minute))).toBe(expected);
  });

  test('memakai waktu sekarang bila argumen tidak diberikan', () => {
    expect(['Good morning', 'Good afternoon', 'Good evening']).toContain(getGreeting());
  });
});
