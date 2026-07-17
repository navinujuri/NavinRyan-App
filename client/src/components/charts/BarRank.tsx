import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CHART, seqBlue } from '../../theme/chart';
import { fmtVolume } from '../../lib/format';
import { ChartFrame, TooltipCard, axisProps } from './common';

export interface RankDatum {
  label: string;
  value: number;
}

/**
 * Horizontal ranked bars. Magnitude is the job → a single SEQUENTIAL blue hue
 * (darker = larger), never 12 cycled categorical colors. Direct value labels.
 */
export function BarRank({
  data,
  height = 360,
  unit = '',
  valueFormat = fmtVolume,
}: {
  data: RankDatum[];
  height?: number;
  unit?: string;
  valueFormat?: (n: number) => string;
}) {
  const sorted = [...data].sort((a, b) => b.value - a.value);
  const max = Math.max(1, ...sorted.map((d) => d.value));

  return (
    <ChartFrame height={height} hasData={sorted.some((d) => d.value > 0)}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={sorted}
          layout="vertical"
          margin={{ top: 4, right: 44, bottom: 4, left: 4 }}
          barCategoryGap={6}
        >
          <XAxis type="number" hide domain={[0, max * 1.02]} />
          <YAxis
            type="category"
            dataKey="label"
            {...axisProps}
            width={92}
            tick={{ fill: CHART.textSecondary, fontSize: 11 }}
          />
          <Tooltip
            cursor={{ fill: 'rgba(255,255,255,0.04)' }}
            content={({ active, payload }) =>
              active && payload && payload.length ? (
                <TooltipCard
                  title={String(payload[0].payload.label)}
                  rows={[{ label: 'Volume', value: `${valueFormat(Number(payload[0].value))}${unit}`, color: seqBlue(Number(payload[0].value) / max) }]}
                />
              ) : null
            }
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} isAnimationActive={false} label={{ position: 'right', fill: CHART.textSecondary, fontSize: 11, formatter: (v: number) => valueFormat(v) }}>
            {sorted.map((d, i) => (
              <Cell key={i} fill={seqBlue(0.25 + 0.75 * (d.value / max))} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
