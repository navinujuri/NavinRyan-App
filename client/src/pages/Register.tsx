import { useState, type FormEvent } from 'react';
import { useAuth } from '../state/AuthContext';
import { AuthShell } from './AuthShell';

export function Register({ onLogin }: { onLogin: () => void }) {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await register(name.trim(), email.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create account.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell subtitle="Create your account to start tracking">
      <form onSubmit={submit} className="card space-y-4 p-6">
        <div>
          <label className="label" htmlFor="name">Name</label>
          <input id="name" className="field" autoFocus autoComplete="name"
            value={name} onChange={(e) => setName(e.target.value)} placeholder="Navin" />
        </div>
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" type="email" className="field" autoComplete="email"
            value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input id="password" type="password" className="field" autoComplete="new-password"
            value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" />
        </div>
        {error && (
          <p className="rounded-lg border border-bad/30 bg-bad/10 px-3 py-2 text-xs font-medium text-bad">{error}</p>
        )}
        <button type="submit" className="btn-primary w-full" disabled={busy || !email || password.length < 6}>
          {busy ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-fg-muted">
        Already have an account?{' '}
        <button onClick={onLogin} className="font-semibold text-accent-soft hover:underline">
          Sign in
        </button>
      </p>
    </AuthShell>
  );
}
