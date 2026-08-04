import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { cn } from '../lib/utils';

export interface StatCardProps {
  label: string;
  value: string;
  icon?: LucideIcon;
  accentClassName?: string;
  subtext?: string;
}

/** Stat-tile contract: label (sentence case) + value (semibold, auto-compact). No trailing colon. */
export function StatCard({ label, value, icon: Icon, accentClassName = 'text-series-blue', subtext }: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3 p-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-ink-secondary">{label}</span>
          <span className="text-2xl font-semibold text-ink-primary">{value}</span>
          {subtext && <span className="text-xs text-ink-muted">{subtext}</span>}
        </div>
        {Icon && (
          <div className={cn('rounded-lg bg-surface-hover p-2', accentClassName)}>
            <Icon className="h-4 w-4" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
