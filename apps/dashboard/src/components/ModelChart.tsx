import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { ModelUsageBreakdown } from '@claude-assist/usage';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { EmptyState } from './EmptyState';
import { formatCompactNumber, formatPercent } from '../lib/utils';
import { MODEL_FAMILY_COLORS } from '../lib/model-colors';

export interface ModelChartProps {
  models: ModelUsageBreakdown[];
}

export function ModelChart({ models }: ModelChartProps) {
  if (models.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Token usage by model</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState title="No model usage yet" />
        </CardContent>
      </Card>
    );
  }

  const data = models.map((m) => ({ ...m, percentLabel: formatPercent(m.shareOfTotalTokens) }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Token usage by model</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 8, right: 32, bottom: 0, left: 8 }}>
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="displayName"
                width={110}
                tick={{ fill: '#c3c2b7', fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{ background: '#1a1a19', border: '1px solid #2c2c2a', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: '#c3c2b7' }}
                itemStyle={{ color: '#ffffff' }}
                formatter={(value: number, _name, item) => [
                  `${formatCompactNumber(value)} tokens (${formatPercent(item.payload.shareOfTotalTokens)})`,
                  item.payload.displayName,
                ]}
              />
              <Bar dataKey="totalTokens" radius={[0, 4, 4, 0]} maxBarSize={24} label={{ position: 'right', fill: '#898781', fontSize: 12, formatter: (value: number) => formatCompactNumber(value) }}>
                {data.map((entry) => (
                  <Cell key={entry.model} fill={MODEL_FAMILY_COLORS[entry.family] ?? MODEL_FAMILY_COLORS.unknown} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
