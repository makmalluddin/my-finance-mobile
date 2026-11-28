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

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  const signIn = useCallback(async (credentials) => {
    const data = await authService.signIn(credentials);
    setSession(data?.session ?? null);
    return data;
  }, []);

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

  const displayName = useMemo(() => getDisplayName(session?.user), [session]);

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      displayName,
      isAuthenticated: Boolean(session?.user),
      isReady,
      signIn,
      signUp,
      signOut,
      updateDisplayName,
    }),
    [
      session,
      displayName,
      isReady,
      signIn,
      signUp,
      signOut,
      updateDisplayName,
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
