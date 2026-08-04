import { useSearchParams } from 'react-router-dom';
import type { RangeOption } from '@claude-assist/usage';
import { RANGE_LABELS, RANGE_OPTIONS } from '../services/analytics-api';
import { cn } from '../lib/utils';

export const RANGE_SEARCH_PARAM = 'range';

export function useRangeFilter(): RangeOption {
  const [searchParams] = useSearchParams();
  const raw = searchParams.get(RANGE_SEARCH_PARAM);
  return RANGE_OPTIONS.includes(raw as RangeOption) ? (raw as RangeOption) : 'all';
}

/** Segmented time-range control, persisted to the URL (?range=) so the choice holds across pages. */
export function RangeFilter() {
  const [searchParams, setSearchParams] = useSearchParams();
  const range = useRangeFilter();

  const setRange = (next: RangeOption) => {
    const params = new URLSearchParams(searchParams);
    if (next === 'all') params.delete(RANGE_SEARCH_PARAM);
    else params.set(RANGE_SEARCH_PARAM, next);
    setSearchParams(params, { replace: true });
  };

  return (
    <div className="flex items-center gap-1 rounded-lg border border-border bg-surface-hover p-1" role="group" aria-label="Time range">
      {RANGE_OPTIONS.map((option) => (
        <button
          key={option}
          onClick={() => setRange(option)}
          className={cn(
            'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
            range === option
              ? 'bg-series-blue/15 text-series-blue'
              : 'text-ink-secondary hover:bg-surface hover:text-ink-primary',
          )}
        >
          {RANGE_LABELS[option]}
        </button>
      ))}
    </div>
  );
}
