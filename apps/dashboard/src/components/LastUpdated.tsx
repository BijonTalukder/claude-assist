import { formatTime } from '../lib/utils';

export interface LastUpdatedProps {
  lastUpdated: Date | null;
  isLoading: boolean;
  hasError: boolean;
}

export function LastUpdated({ lastUpdated, isLoading, hasError }: LastUpdatedProps) {
  const dotClass = hasError ? 'bg-status-critical' : isLoading ? 'bg-status-warning' : 'bg-status-good';
  const label = hasError ? 'Refresh failed' : isLoading && !lastUpdated ? 'Loading…' : lastUpdated ? `Updated ${formatTime(lastUpdated)}` : '—';

  return (
    <div className="flex items-center gap-2 text-xs text-ink-muted">
      <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
      {label}
    </div>
  );
}
