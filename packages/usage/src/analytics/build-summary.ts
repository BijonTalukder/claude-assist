import type { UsageSummary, UsageWindowStats } from '../types/analytics.js';
import type { ResolvedTurn } from './resolved-turn.js';
import { resolveModel } from '../models/model-catalog.js';
import { isSameUtcDay, isWithinLastNDays } from './time-windows.js';

function emptyWindow(): UsageWindowStats {
  return { totalTokens: 0, totalCostUsd: 0, sessionCount: 0 };
}

function windowStats(turns: ResolvedTurn[], predicate: (turn: ResolvedTurn) => boolean): UsageWindowStats {
  const stats = emptyWindow();
  const sessionIds = new Set<string>();

  for (const turn of turns) {
    if (!predicate(turn)) continue;
    stats.totalTokens += turn.totalTokens;
    stats.totalCostUsd += turn.costUsd;
    sessionIds.add(turn.sessionId);
  }

  stats.sessionCount = sessionIds.size;
  return stats;
}

function findMostUsedModel(turns: ResolvedTurn[]): string | null {
  const tokensByDisplayName = new Map<string, number>();
  for (const turn of turns) {
    const { displayName } = resolveModel(turn.model);
    tokensByDisplayName.set(displayName, (tokensByDisplayName.get(displayName) ?? 0) + turn.totalTokens);
  }

  let best: string | null = null;
  let bestTokens = -1;
  for (const [displayName, tokens] of tokensByDisplayName) {
    if (tokens > bestTokens) {
      best = displayName;
      bestTokens = tokens;
    }
  }
  return best;
}

function findMostActiveProject(turns: ResolvedTurn[]): string | null {
  const sessionsByProject = new Map<string, Set<string>>();
  for (const turn of turns) {
    const sessionIds = sessionsByProject.get(turn.projectName) ?? new Set<string>();
    sessionIds.add(turn.sessionId);
    sessionsByProject.set(turn.projectName, sessionIds);
  }

  let best: string | null = null;
  let bestCount = -1;
  for (const [projectName, sessionIds] of sessionsByProject) {
    if (sessionIds.size > bestCount) {
      best = projectName;
      bestCount = sessionIds.size;
    }
  }
  return best;
}

export function buildSummary(turns: ResolvedTurn[], totalSessions: number, now: Date): UsageSummary {
  const totalInputTokens = turns.reduce((sum, t) => sum + t.tokens.input, 0);
  const totalOutputTokens = turns.reduce((sum, t) => sum + t.tokens.output, 0);
  const totalCacheReadTokens = turns.reduce((sum, t) => sum + t.tokens.cacheRead, 0);
  const totalCacheCreationTokens = turns.reduce((sum, t) => sum + t.tokens.cacheCreation, 0);
  const totalTokens = turns.reduce((sum, t) => sum + t.totalTokens, 0);
  const totalCostUsd = turns.reduce((sum, t) => sum + t.costUsd, 0);

  return {
    totalSessions,
    totalInputTokens,
    totalOutputTokens,
    totalCacheReadTokens,
    totalCacheCreationTokens,
    totalTokens,
    totalCostUsd,
    averageSessionTokens: totalSessions === 0 ? 0 : totalTokens / totalSessions,
    mostUsedModel: findMostUsedModel(turns),
    mostActiveProject: findMostActiveProject(turns),
    today: windowStats(turns, (t) => isSameUtcDay(t.timestamp, now)),
    last7Days: windowStats(turns, (t) => isWithinLastNDays(t.timestamp, now, 7)),
    last30Days: windowStats(turns, (t) => isWithinLastNDays(t.timestamp, now, 30)),
    lifetime: windowStats(turns, () => true),
  };
}
