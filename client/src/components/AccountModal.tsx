import { useState } from 'react';
import { Modal } from './ui/Modal';
import { useAuth } from '../state/AuthContext';
import { api } from '../api/client';
import { IconCheck } from './ui/icons';

export function AccountModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, logout } = useAuth();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const changePassword = async () => {
    setBusy(true);
    setMsg(null);
    try {
      await api.changePassword(current, next);
      setMsg({ kind: 'ok', text: 'Password updated.' });
      setCurrent('');
      setNext('');
    } catch (e) {
      setMsg({ kind: 'err', text: e instanceof Error ? e.message : 'Failed to update password.' });
    } finally {
      setBusy(false);
    }
  };

  const deleteAccount = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 4000);
      return;
    }
    setBusy(true);
    try {
      await api.deleteAccount();
      logout(); // token cleared → back to login
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Account">
      <div className="space-y-5">
        <div className="rounded-lg border border-hair bg-ink-900/40 px-3 py-2.5 text-sm">
          <div className="flex justify-between"><span className="text-fg-faint">Name</span><span className="font-medium text-fg">{user?.displayName}</span></div>
          <div className="mt-1 flex justify-between"><span className="text-fg-faint">Email</span><span className="font-medium text-fg">{user?.email}</span></div>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-fg-faint">Change password</p>
          <div className="space-y-2">
            <input className="field" type="password" autoComplete="current-password" placeholder="Current password" value={current} onChange={(e) => setCurrent(e.target.value)} />
            <input className="field" type="password" autoComplete="new-password" placeholder="New password (6+ chars)" value={next} onChange={(e) => setNext(e.target.value)} />
          </div>
          {msg && (
            <p className={`mt-2 rounded-lg border px-3 py-2 text-xs font-medium ${msg.kind === 'ok' ? 'border-good/30 bg-good/10 text-good' : 'border-bad/30 bg-bad/10 text-bad'}`}>
              {msg.kind === 'ok' && <IconCheck width={12} height={12} className="mr-1 inline" />}{msg.text}
            </p>
          )}
          <button className="btn-primary mt-3" onClick={changePassword} disabled={busy || !current || next.length < 6}>
            {busy ? 'Saving…' : 'Update password'}
          </button>
        </div>

        <div className="border-t border-hair pt-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-bad">Danger zone</p>
          <p className="mb-2 text-xs text-fg-faint">Permanently delete your account and all its data. This cannot be undone.</p>
          <button className="btn-danger" onClick={deleteAccount} disabled={busy}>
            {confirmDelete ? 'Confirm — delete everything?' : 'Delete account'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
