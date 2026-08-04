import { Info, Lightbulb, TriangleAlert } from 'lucide-react';
import type { Insight } from '@claude-assist/usage';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

const SEVERITY_ICON = {
  info: Info,
  tip: Lightbulb,
  warning: TriangleAlert,
} as const;

const SEVERITY_COLOR = {
  info: 'text-series-blue',
  tip: 'text-status-good',
  warning: 'text-status-warning',
} as const;

export interface InsightsListProps {
  insights: Insight[];
}

export function InsightsList({ insights }: InsightsListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Insights</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {insights.map((insight) => {
          const Icon = SEVERITY_ICON[insight.severity];
          return (
            <div key={insight.id} className="flex items-start gap-2.5 text-sm text-ink-secondary">
              <Icon className={`mt-0.5 h-4 w-4 flex-shrink-0 ${SEVERITY_COLOR[insight.severity]}`} />
              <span>{insight.message}</span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
