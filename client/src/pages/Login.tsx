import { useState, type FormEvent } from 'react';
import { useAuth } from '../state/AuthContext';
import { IconFlame } from '../components/ui/icons';
import { AuthShell } from './AuthShell';

export function Login({ onRegister }: { onRegister: () => void }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.');
      setPassword('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell subtitle="Sign in to log your transformation">
      <form onSubmit={submit} className="card space-y-4 p-6">
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" type="email" className="field" autoFocus autoComplete="email"
            value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input id="password" type="password" className="field" autoComplete="current-password"
            value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        </div>
        {error && (
          <p className="rounded-lg border border-bad/30 bg-bad/10 px-3 py-2 text-xs font-medium text-bad">{error}</p>
        )}
        <button type="submit" className="btn-primary w-full" disabled={busy || !email || !password}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-fg-muted">
        New here?{' '}
        <button onClick={onRegister} className="font-semibold text-accent-soft hover:underline">
          Create an account
        </button>
      </p>
      <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-[11px] text-fg-faint">
        <IconFlame width={12} height={12} /> Private · your data stays yours
      </p>
    </AuthShell>
  );
}
