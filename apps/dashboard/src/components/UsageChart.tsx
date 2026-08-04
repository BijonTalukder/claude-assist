import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { EmptyState } from './EmptyState';
import { formatCompactNumber } from '../lib/utils';

export interface UsageChartPoint {
  date: string;
  value: number;
}

export interface UsageChartProps {
  title: string;
  data: UsageChartPoint[];
  color?: string;
  valueFormatter?: (value: number) => string;
}

function formatAxisDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function UsageChart({ title, data, color = '#3987e5', valueFormatter = formatCompactNumber }: UsageChartProps) {
  const hasSignal = data.some((point) => point.value > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {!hasSignal ? (
          <EmptyState title="No activity in this range" />
        ) : (
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid stroke="#2c2c2a" strokeDasharray="0" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatAxisDate}
                  stroke="#383835"
                  tick={{ fill: '#898781', fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: '#383835' }}
                  minTickGap={24}
                />
                <YAxis
                  stroke="#383835"
                  tick={{ fill: '#898781', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  width={48}
                  tickFormatter={(value: number) => formatCompactNumber(value)}
                />
                <Tooltip
                  contentStyle={{ background: '#1a1a19', border: '1px solid #2c2c2a', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: '#c3c2b7' }}
                  itemStyle={{ color: '#ffffff' }}
                  labelFormatter={(label: string) => formatAxisDate(label)}
                  formatter={(value: number) => [valueFormatter(value), title]}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={color}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  dot={false}
                  activeDot={{ r: 4, stroke: '#1a1a19', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
