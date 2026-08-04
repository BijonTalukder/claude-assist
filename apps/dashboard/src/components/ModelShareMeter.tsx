import type { ModelUsageBreakdown } from '@claude-assist/usage';
import { MODEL_FAMILY_COLORS } from '../lib/model-colors';
import { formatCompactNumber, formatPercent, formatUsd } from '../lib/utils';

export interface ModelShareMeterProps {
  model: ModelUsageBreakdown;
}

/** Meter contract: fill carries identity, unfilled track is the muted surface — matches the "Claude Sonnet 82%" example. */
export function ModelShareMeter({ model }: ModelShareMeterProps) {
  const color = MODEL_FAMILY_COLORS[model.family] ?? MODEL_FAMILY_COLORS.unknown;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-ink-primary">{model.displayName}</span>
        <span className="text-xl font-semibold text-ink-primary">{formatPercent(model.shareOfTotalTokens)}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-hover">
        <div
          className="h-full rounded-full"
          style={{ width: `${Math.max(model.shareOfTotalTokens * 100, 2)}%`, backgroundColor: color }}
        />
      </div>
      <div className="flex justify-between text-xs text-ink-muted">
        <span>{formatCompactNumber(model.totalTokens)} tokens</span>
        <span>{model.sessionCount} sessions</span>
        <span>{formatUsd(model.totalCostUsd)}</span>
      </div>
    </div>
  );
}
