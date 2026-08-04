import type { ProjectUsageBreakdown } from '../types/analytics.js';
import type { ResolvedTurn } from './resolved-turn.js';

interface MutableProjectStats {
  projectName: string;
  totalTokens: number;
  totalCostUsd: number;
  sessionIds: Set<string>;
  lastActivity: string | null;
}

export function buildProjectBreakdown(turns: ResolvedTurn[]): ProjectUsageBreakdown[] {
  const statsByPath = new Map<string, MutableProjectStats>();

  for (const turn of turns) {
    const stats =
      statsByPath.get(turn.projectPath) ??
      ({ projectName: turn.projectName, totalTokens: 0, totalCostUsd: 0, sessionIds: new Set(), lastActivity: null } as MutableProjectStats);

    stats.totalTokens += turn.totalTokens;
    stats.totalCostUsd += turn.costUsd;
    stats.sessionIds.add(turn.sessionId);
    if (!stats.lastActivity || turn.timestamp > stats.lastActivity) {
      stats.lastActivity = turn.timestamp;
    }

    statsByPath.set(turn.projectPath, stats);
  }

  const grandTotalTokens = Array.from(statsByPath.values()).reduce((sum, s) => sum + s.totalTokens, 0);

  return Array.from(statsByPath.entries())
    .map(([projectPath, stats]) => ({
      projectPath,
      projectName: stats.projectName,
      totalTokens: stats.totalTokens,
      totalCostUsd: stats.totalCostUsd,
      sessionCount: stats.sessionIds.size,
      lastActivity: stats.lastActivity,
      shareOfTotalTokens: grandTotalTokens === 0 ? 0 : stats.totalTokens / grandTotalTokens,
    }))
    .sort((a, b) => b.totalTokens - a.totalTokens);
}
