import {
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { CHART } from '../../theme/chart';
import { ChartFrame, TooltipCard } from './common';

export interface RadarSeries {
  name: string;
  color: string;
  values: Record<string, number>;
}

/**
 * Physique self-score radar. One primary series (current), with an optional
 * faint "start" comparison series — both direct-labeled via the legend so
 * identity never rests on color alone.
 */
export function PhysiqueRadar({
  axes,
  series,
  height = 340,
}: {
  axes: string[];
  series: RadarSeries[];
  height?: number;
}) {
  const data = axes.map((axis) => {
    const row: Record<string, number | string> = { axis };
    for (const s of series) row[s.name] = s.values[axis] ?? 0;
    return row;
  });

  return (
    <ChartFrame height={height} hasData={series.length > 0}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="72%" margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <PolarGrid stroke={CHART.grid} />
          <PolarAngleAxis dataKey="axis" tick={{ fill: CHART.textSecondary, fontSize: 11 }} />
          <PolarRadiusAxis
            domain={[0, 10]}
            tickCount={6}
            tick={{ fill: CHART.axis, fontSize: 9 }}
            axisLine={false}
            stroke={CHART.grid}
          />
          {series.map((s) => (
            <Radar
              key={s.name}
              name={s.name}
              dataKey={s.name}
              stroke={s.color}
              fill={s.color}
              fillOpacity={0.18}
              strokeWidth={2}
              dot={{ r: 2.5, fill: s.color, strokeWidth: 0 }}
              isAnimationActive={false}
            />
          ))}
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
            formatter={(v) => <span style={{ color: CHART.textSecondary }}>{v}</span>}
          />
          <Tooltip
            content={({ active, payload }) =>
              active && payload && payload.length ? (
                <TooltipCard
                  title={String(payload[0].payload.axis)}
                  rows={payload.map((p) => ({
                    label: String(p.name),
                    value: `${p.value}/10`,
                    color: p.color as string,
                  }))}
                />
              ) : null
            }
          />
        </RadarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
