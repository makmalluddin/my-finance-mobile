import { supabase } from '@/data/supabase/client';

/**
 * Akses data Auth. Repository hanya meneruskan hasil Supabase; aturan
 * validasi dan penerjemahan error ada di AuthService.
 */
export const authRepository = {
  getSession: () => supabase.auth.getSession(),

  getUser: () => supabase.auth.getUser(),

  signIn: ({ email, password }) => supabase.auth.signInWithPassword({ email, password }),

  signUp: ({ email, password }) => supabase.auth.signUp({ email, password }),

  signOut: () => supabase.auth.signOut(),

  onAuthStateChange: (callback) => supabase.auth.onAuthStateChange(callback),
};

export default authRepository;
