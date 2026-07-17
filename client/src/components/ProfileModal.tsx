import { useEffect, useState } from 'react';
import { Modal } from './ui/Modal';
import { useData } from '../state/DataContext';
import type { Profile } from '../types';

const FIELDS: { key: keyof Profile; label: string; type: 'text' | 'number' | 'date'; unit?: string; step?: number }[] = [
  { key: 'name', label: 'Name', type: 'text' },
  { key: 'age', label: 'Age', type: 'number' },
  { key: 'height', label: 'Height', type: 'number', unit: 'cm' },
  { key: 'startDate', label: 'Start Date', type: 'date' },
  { key: 'targetDate', label: 'Target Date', type: 'date' },
  { key: 'currentWeight', label: 'Current Weight', type: 'number', unit: 'kg', step: 0.1 },
  { key: 'goalWeight', label: 'Goal Weight', type: 'number', unit: 'kg', step: 0.1 },
  { key: 'currentWaist', label: 'Current Waist', type: 'number', unit: 'cm', step: 0.1 },
  { key: 'goalWaist', label: 'Goal Waist', type: 'number', unit: 'cm', step: 0.1 },
  { key: 'bodyFat', label: 'Body Fat', type: 'number', unit: '%', step: 0.1 },
  { key: 'goalBodyFat', label: 'Goal Body Fat', type: 'number', unit: '%', step: 0.1 },
];

export function ProfileModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { profile, saveProfile } = useData();
  const [form, setForm] = useState<Profile | null>(profile);
  const [saving, setSaving] = useState(false);

  // Snapshot the profile into local state each time the modal opens.
  useEffect(() => {
    if (open) setForm(profile);
  }, [open, profile]);

  const current = form ?? profile;
  if (!current) return null;

  const set = (key: keyof Profile, value: string) =>
    setForm({ ...current, [key]: value } as Profile);

  const submit = async () => {
    setSaving(true);
    try {
      await saveProfile(current);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit Profile"
      wide
      footer={
        <>
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={submit} disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {FIELDS.map((f) => (
          <div key={String(f.key)}>
            <label className="label">
              {f.label} {f.unit && <span className="text-fg-faint">({f.unit})</span>}
            </label>
            <input
              className="field"
              type={f.type}
              step={f.step}
              value={String(current[f.key] ?? '')}
              onChange={(e) => set(f.key, e.target.value)}
            />
          </div>
        ))}
      </div>
    </Modal>
  );
}
