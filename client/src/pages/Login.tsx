import { useState, type FormEvent } from 'react';
import { useAuth } from '../state/AuthContext';
import { IconFlame } from '../components/ui/icons';

export function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(username.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.');
      setPassword('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-sm animate-fade-in">
        {/* Brand */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-accent-grad shadow-glow">
            <IconFlame className="text-white" width={30} height={30} />
          </div>
          <h1 className="mt-4 text-xl font-bold tracking-tight text-fg">Ryan Reynolds Physique Tracker</h1>
          <p className="mt-1 text-sm text-fg-faint">Sign in to log your transformation</p>
        </div>

        {/* Card */}
        <form onSubmit={submit} className="card space-y-4 p-6">
          <div>
            <label className="label" htmlFor="username">Username</label>
            <input
              id="username"
              className="field"
              autoFocus
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="navin"
            />
          </div>
          <div>
            <label className="label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="field"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="rounded-lg border border-bad/30 bg-bad/10 px-3 py-2 text-xs font-medium text-bad">
              {error}
            </p>
          )}

          <button type="submit" className="btn-primary w-full" disabled={busy || !username || !password}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-[11px] text-fg-faint">
          Phase 1 · 16-Week Aesthetic Program · Private tracker
        </p>
      </div>
    </div>
  );
}
