import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authService } from '@/appservices/auth/authService';
import { LoadingState } from '@/shared/components';
import { getDisplayName } from './displayName';

const AuthContext = createContext(null);

/**
 * Menyediakan sesi Supabase ke seluruh aplikasi. Memberi `isReady` agar
 * navigator tidak mengambil keputusan proteksi sebelum sesi selesai dibaca.
 */
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [loginHistory, setLoginHistory] = useState([]);

  const refreshLoginHistory = useCallback(async () => {
    try {
      const history = await authService.listLoginHistory();
      setLoginHistory(history);
      return history;
    } catch {
      setLoginHistory([]);
      return [];
    }
  }, []);

  useEffect(() => {
    let active = true;

    const unsubscribe = authService.subscribe((_event, nextSession) => {
      if (!active) {
        return;
      }
      setSession(nextSession);
      setIsReady(true);
    });

    authService
      .getSession()
      .then((currentSession) => {
        if (active) {
          setSession(currentSession);
        }
      })
      .catch(() => {
        if (active) {
          setSession(null);
        }
      })
      .finally(() => {
        if (active) {
          setIsReady(true);
        }
      });

    // Riwayat hanya pelengkap UI. Dimuat di microtask agar tidak memicu
    // setState sinkron di dalam effect body.
    void Promise.resolve().then(refreshLoginHistory);

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [refreshLoginHistory]);

  const signIn = useCallback(
    async (credentials) => {
      const data = await authService.signIn(credentials);
      setSession(data?.session ?? null);
      await refreshLoginHistory();
      return data;
    },
    [refreshLoginHistory]
  );

  const signUp = useCallback(async (credentials) => {
    const data = await authService.signUp(credentials);
    if (data?.session) {
      setSession(data.session);
    }
    return data;
  }, []);

  const signOut = useCallback(async () => {
    await authService.signOut();
    setSession(null);
  }, []);

  const updateDisplayName = useCallback(async (name) => {
    const updatedUser = await authService.updateDisplayName(name);

    setSession((current) =>
      current && updatedUser ? { ...current, user: updatedUser } : current
    );

    return updatedUser;
  }, []);

  const removeLoginEmail = useCallback(async (email) => {
    const next = await authService.removeLoginEmail(email);
    setLoginHistory(next);
    return next;
  }, []);

  const clearLoginHistory = useCallback(async () => {
    const next = await authService.clearLoginHistory();
    setLoginHistory(next);
    return next;
  }, []);

  const displayName = useMemo(() => getDisplayName(session?.user), [session]);

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      displayName,
      isAuthenticated: Boolean(session?.user),
      isReady,
      loginHistory,
      signIn,
      signUp,
      signOut,
      updateDisplayName,
      refreshLoginHistory,
      removeLoginEmail,
      clearLoginHistory,
    }),
    [
      session,
      displayName,
      isReady,
      loginHistory,
      signIn,
      signUp,
      signOut,
      updateDisplayName,
      refreshLoginHistory,
      removeLoginEmail,
      clearLoginHistory,
    ]
  );

  if (!isReady) {
    return <LoadingState message="Menyiapkan sesi..." />;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth harus dipakai di dalam AuthProvider.');
  }

  return context;
}

export default AuthProvider;
