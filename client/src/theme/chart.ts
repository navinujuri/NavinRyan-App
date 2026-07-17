/**
 * Chart color tokens — sourced from the validated data-viz dark palette
 * (references/palette.md, dark column). Rules honoured:
 *  - single-series charts choose any one hue freely (no CVD concern);
 *  - the muscle overview uses a SEQUENTIAL blue ramp for magnitude (never 12
 *    cycled categorical hues);
 *  - deltas use the reserved status good/critical steps;
 *  - the brand red (#ef4444) is chrome only and never used as a chart series.
 */

export const CHART = {
  surface: '#141519',
  grid: '#23252c',
  axis: '#6b7079',
  textPrimary: '#f5f6f7',
  textSecondary: '#a1a5ad',
  good: '#0ca30c',
  bad: '#e5484d',
  // Per-metric single-series hues (dark steps).
  weight: '#3987e5', // blue
  waist: '#199e70', // aqua
  bodyFat: '#d95926', // orange
  volume: '#3987e5', // blue
  strength: '#9085e9', // violet
  physique: '#f87171', // brand-soft (single series on radar)
} as const;

// Validated 8-hue categorical order (dark). Assign in order, never cycle.
export const CATEGORICAL = [
  '#3987e5', // blue
  '#008300', // green
  '#d55181', // magenta
  '#c98500', // yellow
  '#199e70', // aqua
  '#d95926', // orange
  '#9085e9', // violet
  '#e66767', // red
] as const;

// Sequential blue ramp (light → dark) for magnitude encoding.
export const SEQUENTIAL_BLUE = [
  '#cde2fb',
  '#9ec5f4',
  '#6da7ec',
  '#3987e5',
  '#256abf',
  '#184f95',
  '#104281',
] as const;

/** Pick a sequential-blue step by normalized magnitude t ∈ [0,1]. */
export function seqBlue(t: number): string {
  const clamped = Math.max(0, Math.min(1, t));
  const idx = Math.round(clamped * (SEQUENTIAL_BLUE.length - 1));
  return SEQUENTIAL_BLUE[idx];
}
