import type { ReactNode } from 'react';
import { IconArrowDown, IconArrowUp } from './icons';

// ── Card ─────────────────────────────────────────────────────────────────────
export function Card({
  children,
  className = '',
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return <div className={`card ${padded ? 'p-5' : ''} ${className}`}>{children}</div>;
}

export function CardTitle({
  title,
  subtitle,
  icon,
  right,
}: {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="flex items-center gap-2.5">
        {icon && <span className="text-accent-soft">{icon}</span>}
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-fg">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-fg-faint">{subtitle}</p>}
        </div>
      </div>
      {right}
    </div>
  );
}

// ── Page header ──────────────────────────────────────────────────────────────
export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-fg-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

// ── Delta badge ──────────────────────────────────────────────────────────────
export function Delta({
  value,
  suffix = '',
  invert = false,
  neutralZero = true,
}: {
  value: number;
  suffix?: string;
  /** invert=true → a decrease is "good" (weight, waist, body fat). */
  invert?: boolean;
  neutralZero?: boolean;
}) {
  const isZero = Math.abs(value) < 0.05;
  const good = invert ? value < 0 : value > 0;
  const color = isZero && neutralZero ? 'text-fg-faint' : good ? 'text-good' : 'text-bad';
  const Arrow = value > 0 ? IconArrowUp : IconArrowDown;
  const abs = Math.abs(value);
  const shown = abs >= 100 ? Math.round(abs).toLocaleString() : abs.toFixed(1);
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold tabular-nums ${color}`}>
      {!isZero && <Arrow width={13} height={13} />}
      {isZero ? '±0' : shown}
      {suffix}
    </span>
  );
}

// ── Stat tile ────────────────────────────────────────────────────────────────
export function StatTile({
  label,
  value,
  unit,
  icon,
  delta,
  hint,
  accent = false,
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  icon?: ReactNode;
  delta?: ReactNode;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div className={`card p-4 ${accent ? 'ring-1 ring-accent/30' : ''}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-fg-faint">{label}</span>
        {icon && <span className={accent ? 'text-accent-soft' : 'text-fg-faint'}>{icon}</span>}
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="text-2xl font-bold tabular-nums text-fg">{value}</span>
        {unit && <span className="text-sm text-fg-muted">{unit}</span>}
      </div>
      <div className="mt-1 flex items-center gap-2">
        {delta}
        {hint && <span className="text-xs text-fg-faint">{hint}</span>}
      </div>
    </div>
  );
}

// ── Progress bar ─────────────────────────────────────────────────────────────
export function ProgressBar({
  value,
  max = 100,
  className = '',
  gradient = true,
  height = 'h-2.5',
}: {
  value: number;
  max?: number;
  className?: string;
  gradient?: boolean;
  height?: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className={`w-full overflow-hidden rounded-full bg-ink-750 ${height} ${className}`}>
      <div
        className={`h-full rounded-full transition-all duration-700 ${gradient ? 'bg-accent-grad' : 'bg-accent'}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ── Pill / chip ──────────────────────────────────────────────────────────────
export function Pill({ children, tone = 'default' }: { children: ReactNode; tone?: 'default' | 'accent' | 'good' | 'bad' | 'warn' }) {
  const tones: Record<string, string> = {
    default: 'border-hair bg-ink-800 text-fg-muted',
    accent: 'border-accent/30 bg-accent/10 text-accent-soft',
    good: 'border-good/30 bg-good/10 text-good',
    bad: 'border-bad/30 bg-bad/10 text-bad',
    warn: 'border-warn/30 bg-warn/10 text-warn',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

// ── Empty state ──────────────────────────────────────────────────────────────
export function Empty({ icon, title, hint }: { icon?: ReactNode; title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-hair2 py-10 text-center">
      {icon && <div className="mb-3 text-fg-faint">{icon}</div>}
      <p className="text-sm font-medium text-fg-muted">{title}</p>
      {hint && <p className="mt-1 max-w-sm text-xs text-fg-faint">{hint}</p>}
    </div>
  );
}

// ── Segmented control ────────────────────────────────────────────────────────
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-hair bg-ink-900 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
            value === o.value ? 'bg-ink-750 text-fg shadow-sm' : 'text-fg-faint hover:text-fg-muted'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
