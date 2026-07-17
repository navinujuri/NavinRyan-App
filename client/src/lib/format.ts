// Small formatting helpers shared across the UI.

export const round = (n: number, dp = 1): number => {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
};

export const fmt = (n: number | undefined | null, dp = 1): string => {
  if (n === undefined || n === null || Number.isNaN(n)) return '—';
  return round(n, dp).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: dp,
  });
};

/** Compact volume: 12,340 → "12.3k". */
export const fmtVolume = (n: number): string => {
  if (n >= 1_000_000) return `${round(n / 1_000_000, 1)}M`;
  if (n >= 1000) return `${round(n / 1000, 1)}k`;
  return `${Math.round(n)}`;
};

export const fmtSigned = (n: number, dp = 1, suffix = ''): string => {
  const s = round(n, dp);
  return `${s > 0 ? '+' : ''}${fmt(s, dp)}${suffix}`;
};

export const fmtPct = (n: number, dp = 0): string => `${fmtSigned(n, dp)}%`;

// ── dates ─────────────────────────────────────────────────────────────────
export const parseDate = (s: string): Date => new Date(`${s}T00:00:00`);

export const fmtDate = (s: string): string =>
  parseDate(s).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

export const fmtDateFull = (s: string): string =>
  parseDate(s).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

export const todayISO = (): string => new Date().toISOString().slice(0, 10);

export const daysBetween = (a: string, b: string): number =>
  Math.round((parseDate(b).getTime() - parseDate(a).getTime()) / 86_400_000);

/** Monday-based ISO-ish week key for grouping (e.g. "2026-W23"). */
export function weekKey(dateStr: string): string {
  const d = parseDate(dateStr);
  const day = (d.getDay() + 6) % 7; // Mon=0
  const monday = new Date(d.getTime() - day * 86_400_000);
  const yearStart = new Date(monday.getFullYear(), 0, 1);
  const week = Math.ceil(((monday.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return `${monday.getFullYear()}-W${String(week).padStart(2, '0')}`;
}
