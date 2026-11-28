import { DEFAULT_DISPLAY_NAME, getDisplayName } from '@/modules/auth/displayName';

describe('getDisplayName', () => {
  test('memakai nama dari metadata setelah trim', () => {
    expect(getDisplayName({ user_metadata: { display_name: '  Nadia  ' } })).toBe('Nadia');
  });

  test('memakai fallback untuk akun tanpa metadata', () => {
    expect(getDisplayName({ user_metadata: {} })).toBe(DEFAULT_DISPLAY_NAME);
    expect(getDisplayName(null)).toBe(DEFAULT_DISPLAY_NAME);
  });

  test('memakai fallback untuk nama kosong atau spasi', () => {
    expect(getDisplayName({ user_metadata: { display_name: '' } })).toBe('User');
    expect(getDisplayName({ user_metadata: { display_name: '   ' } })).toBe('User');
  });
});
