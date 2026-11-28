import 'expo-sqlite/localStorage/install';
import { AppState } from 'react-native';
import { createClient } from '@supabase/supabase-js';
import { supabaseConfig } from '@/config/supabase';

/**
 * Satu-satunya Supabase client dalam aplikasi. Repository yang mengimpor
 * modul ini adalah satu-satunya jalur akses Presentation Layer ke backend.
 */
export const supabase = createClient(supabaseConfig.url, supabaseConfig.publishableKey, {
  auth: {
    storage: localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Supabase menyarankan menghentikan refresh loop saat aplikasi tidak aktif.
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
