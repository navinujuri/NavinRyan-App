import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CHART } from '../../theme/chart';
import { fmt, fmtDate } from '../../lib/format';
import { ChartFrame, TooltipCard, axisProps, domainFor, gridProps } from './common';

export interface TrendPoint {
  label: string; // ISO date or category
  value: number;
}

/**
 * Single-series area/line trend. No legend (the card title names the series).
 * Optional goal reference line. `invertGood` flips delta coloring semantics
 * only in the tooltip label (handled by caller); the line itself is one hue.
 */
export function TrendChart({
  data,
  color = CHART.weight,
  unit = '',
  goal,
  goalLabel = 'Goal',
  height = 260,
  dp = 1,
  dateAxis = true,
}: {
  data: TrendPoint[];
  color?: string;
  unit?: string;
  goal?: number;
  goalLabel?: string;
  height?: number;
  dp?: number;
  dateAxis?: boolean;
}) {
  const values = data.map((d) => d.value);
  const domain = domainFor(values, goal);
  const gradId = `grad-${color.replace('#', '')}`;

  return (
    <ChartFrame height={height} hasData={data.length > 0}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -8 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid {...gridProps} />
          <XAxis
            dataKey="label"
            {...axisProps}
            tickFormatter={dateAxis ? (v) => fmtDate(String(v)) : undefined}
            minTickGap={24}
          />
          <YAxis {...axisProps} domain={domain} width={44} tickFormatter={(v) => fmt(Number(v), 0)} />
          {goal !== undefined && (
            <ReferenceLine
              y={goal}
              stroke={CHART.good}
              strokeDasharray="4 4"
              strokeOpacity={0.7}
              label={{ value: `${goalLabel} ${goal}${unit}`, position: 'insideBottomRight', fill: CHART.good, fontSize: 10 }}
            />
          )}
          <Tooltip
            cursor={{ stroke: CHART.axis, strokeDasharray: '3 3' }}
            content={({ active, payload, label }) =>
              active && payload && payload.length ? (
                <TooltipCard
                  title={dateAxis ? fmtDate(String(label)) : String(label)}
                  rows={[{ label: 'Value', value: `${fmt(Number(payload[0].value), dp)}${unit}`, color }]}
                />
              ) : null
            }
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradId})`}
            dot={{ r: 2.5, fill: color, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: color, stroke: CHART.surface, strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
