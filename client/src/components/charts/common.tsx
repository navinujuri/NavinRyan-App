import type { ReactNode } from 'react';
import { CHART } from '../../theme/chart';

/** Consistent axis / grid styling props for Recharts. */
export const axisProps = {
  stroke: CHART.axis,
  tick: { fill: CHART.axis, fontSize: 11 },
  tickLine: false,
  axisLine: { stroke: CHART.grid },
} as const;

export const gridProps = {
  stroke: CHART.grid,
  strokeDasharray: '0',
  vertical: false,
} as const;

/** Compute a padded numeric domain, optionally including a goal marker. */
export function domainFor(values: number[], goal?: number, padRatio = 0.12): [number, number] {
  const all = goal !== undefined ? [...values, goal] : values;
  if (all.length === 0) return [0, 1];
  const min = Math.min(...all);
  const max = Math.max(...all);
  const span = max - min || Math.abs(max) || 1;
  const pad = span * padRatio;
  return [Math.floor((min - pad) * 10) / 10, Math.ceil((max + pad) * 10) / 10];
}

/** Themed tooltip card. */
export function TooltipCard({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; value: string; color?: string }[];
}) {
  return (
    <div className="rounded-lg border border-hair2 bg-ink-800/95 px-3 py-2 shadow-card backdrop-blur">
      <p className="mb-1 text-xs font-semibold text-fg">{title}</p>
      <div className="space-y-0.5">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            {r.color && <span className="h-2 w-2 rounded-full" style={{ background: r.color }} />}
            <span className="text-fg-faint">{r.label}</span>
            <span className="ml-auto font-semibold tabular-nums text-fg">{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Frame that guarantees a fixed height and shows an empty state when needed. */
export function ChartFrame({
  height = 260,
  hasData,
  emptyLabel = 'No data yet',
  children,
}: {
  height?: number;
  hasData: boolean;
  emptyLabel?: string;
  children: ReactNode;
}) {
  if (!hasData) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border border-dashed border-hair text-xs text-fg-faint"
        style={{ height }}
      >
        {emptyLabel}
      </div>
    );
  }
  return <div style={{ width: '100%', height }}>{children}</div>;
}
