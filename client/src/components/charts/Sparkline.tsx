import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import { CHART } from '../../theme/chart';

/** Tiny inline trend for tables / tiles. No axes, no tooltip. */
export function Sparkline({
  values,
  color = CHART.strength,
  width = 96,
  height = 30,
}: {
  values: number[];
  color?: string;
  width?: number;
  height?: number;
}) {
  if (values.length < 2) {
    return <div style={{ width, height }} className="flex items-center text-[10px] text-fg-faint">—</div>;
  }
  const data = values.map((v, i) => ({ i, v }));
  const id = `spark-${color.replace('#', '')}`;
  return (
    <div style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 3, right: 2, bottom: 3, left: 2 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.4} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#${id})`} dot={false} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
