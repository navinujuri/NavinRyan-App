import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api, tokenStore, type AuthUser } from '../api/client';

type Status = 'loading' | 'authed' | 'anon';

interface AuthState {
  status: Status;
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('loading');
  const [user, setUser] = useState<AuthUser | null>(null);

  // On load: if we hold a token, confirm it with /auth/me; otherwise show login.
  useEffect(() => {
    let cancelled = false;
    if (!tokenStore.get()) {
      setStatus('anon');
      return;
    }
    api
      .me()
      .then(({ user: u }) => {
        if (cancelled) return;
        setUser(u);
        setStatus('authed');
      })
      .catch(() => {
        // 401 is handled inside the client (clears token + reloads); other
        // failures fall back to the login screen.
        if (!cancelled) setStatus('anon');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { token, user: u } = await api.login(email, password);
    tokenStore.set(token);
    setUser(u);
    setStatus('authed');
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const { token, user: u } = await api.register(name, email, password);
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
    () => ({ status, user, login, register, logout }),
    [status, user, login, register, logout],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
