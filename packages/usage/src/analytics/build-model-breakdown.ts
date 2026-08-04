import type { ModelUsageBreakdown } from '../types/analytics.js';
import type { ResolvedTurn } from './resolved-turn.js';
import { resolveModel } from '../models/model-catalog.js';

interface MutableModelStats {
  displayName: string;
  totalTokens: number;
  totalCostUsd: number;
  sessionIds: Set<string>;
}

export function buildModelBreakdown(turns: ResolvedTurn[]): ModelUsageBreakdown[] {
  const statsByFamily = new Map<string, MutableModelStats>();

  for (const turn of turns) {
    const { family, displayName } = resolveModel(turn.model);
    const stats = statsByFamily.get(family) ?? { displayName, totalTokens: 0, totalCostUsd: 0, sessionIds: new Set() };
    stats.totalTokens += turn.totalTokens;
    stats.totalCostUsd += turn.costUsd;
    stats.sessionIds.add(turn.sessionId);
    statsByFamily.set(family, stats);
  }

  const grandTotalTokens = Array.from(statsByFamily.values()).reduce((sum, s) => sum + s.totalTokens, 0);

  return Array.from(statsByFamily.entries())
    .map(([family, stats]) => ({
      model: family,
      displayName: stats.displayName,
      totalTokens: stats.totalTokens,
      totalCostUsd: stats.totalCostUsd,
      sessionCount: stats.sessionIds.size,
      shareOfTotalTokens: grandTotalTokens === 0 ? 0 : stats.totalTokens / grandTotalTokens,
    }))
    .sort((a, b) => b.totalTokens - a.totalTokens);
}
