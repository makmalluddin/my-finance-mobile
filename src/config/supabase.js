/**
 * Konfigurasi koneksi Supabase dari environment Expo (`EXPO_PUBLIC_*`).
 * Nilai publishable/anon bersifat publik; kerahasiaan data dijaga RLS.
 */
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const publishableKey =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !publishableKey) {
  throw new Error(
    'Konfigurasi Supabase belum lengkap. Isi EXPO_PUBLIC_SUPABASE_URL dan ' +
      'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY pada file .env, lalu mulai ulang Expo.'
  );
}

export const supabaseConfig = Object.freeze({
  url,
  publishableKey,
});
