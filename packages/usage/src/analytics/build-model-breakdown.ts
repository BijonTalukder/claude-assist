import type { ModelFamily } from '../models/model-catalog.js';
import type { ModelUsageBreakdown } from '../types/analytics.js';
import type { ResolvedTurn } from './resolved-turn.js';
import { resolveModel } from '../models/model-catalog.js';

interface MutableModelStats {
  family: ModelFamily;
  displayName: string;
  totalTokens: number;
  totalCostUsd: number;
  sessionIds: Set<string>;
}

export function buildModelBreakdown(turns: ResolvedTurn[]): ModelUsageBreakdown[] {
  const statsByModelId = new Map<string, MutableModelStats>();

  for (const turn of turns) {
    const { family, displayName } = resolveModel(turn.model);
    const stats =
      statsByModelId.get(turn.model) ??
      ({ family, displayName, totalTokens: 0, totalCostUsd: 0, sessionIds: new Set() } as MutableModelStats);
    stats.totalTokens += turn.totalTokens;
    stats.totalCostUsd += turn.costUsd;
    stats.sessionIds.add(turn.sessionId);
    statsByModelId.set(turn.model, stats);
  }

  const grandTotalTokens = Array.from(statsByModelId.values()).reduce((sum, s) => sum + s.totalTokens, 0);

  return Array.from(statsByModelId.entries())
    .map(([model, stats]) => ({
      model,
      family: stats.family,
      displayName: stats.displayName,
      totalTokens: stats.totalTokens,
      totalCostUsd: stats.totalCostUsd,
      sessionCount: stats.sessionIds.size,
      shareOfTotalTokens: grandTotalTokens === 0 ? 0 : stats.totalTokens / grandTotalTokens,
    }))
    .sort((a, b) => b.totalTokens - a.totalTokens);
}
