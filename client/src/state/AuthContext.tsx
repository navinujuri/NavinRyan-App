import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api, tokenStore } from '../api/client';

type Status = 'loading' | 'authed' | 'anon';

interface AuthState {
  status: Status;
  user: string | null;
  authRequired: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('loading');
  const [user, setUser] = useState<string | null>(null);
  const [authRequired, setAuthRequired] = useState(false);

  // On load, ask the server whether auth is required, then decide.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const health = await api.health();
        if (cancelled) return;
        setAuthRequired(health.authRequired);
        if (!health.authRequired) {
          setStatus('authed'); // gate disabled (e.g. local dev)
        } else if (tokenStore.get()) {
          setStatus('authed'); // trust stored token; a stale one 401s later → login
        } else {
          setStatus('anon');
        }
      } catch {
        // Can't reach the server — let the app mount and show its own error state.
        if (!cancelled) setStatus(tokenStore.get() ? 'authed' : 'anon');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const { token, user: u } = await api.login(username, password);
    tokenStore.set(token);
    setUser(u);
    setStatus('authed');
  }, []);

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
    setStatus('anon');
  }, []);

  const value = useMemo<AuthState>(
    () => ({ status, user, authRequired, login, logout }),
    [status, user, authRequired, login, logout],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
