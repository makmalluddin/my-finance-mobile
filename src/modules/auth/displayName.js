export const DEFAULT_DISPLAY_NAME = 'User';

/**
 * Nama tampilan berasal dari metadata Auth. Akun baru atau nama kosong
 * memakai fallback `User` tanpa perlu menyimpan nilai default ke backend.
 */
export function getDisplayName(user) {
  const value = user?.user_metadata?.display_name;

  if (typeof value !== 'string') {
    return DEFAULT_DISPLAY_NAME;
  }

  const displayName = value.trim();
  return displayName || DEFAULT_DISPLAY_NAME;
}
