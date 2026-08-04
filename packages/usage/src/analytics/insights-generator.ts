import type { Insight, ModelUsageBreakdown, ProjectUsageBreakdown, UsageSummary } from '../types/analytics.js';
import type { ResolvedTurn } from './resolved-turn.js';
import { calculateCostForFamily } from '../pricing/cost-calculator.js';

const DOMINANT_MODEL_SHARE_THRESHOLD = 0.5;
const DOMINANT_PROJECT_SHARE_THRESHOLD = 0.4;
const MEANINGFUL_HAIKU_SAVINGS_THRESHOLD = 0.05;
const LARGE_SESSION_MULTIPLE_THRESHOLD = 3;
const MIN_SESSIONS_FOR_LARGE_SESSION_INSIGHT = 3;

function toPercent(share: number): number {
  return Math.round(share * 100);
}

function buildDominantModelInsight(models: ModelUsageBreakdown[]): Insight | null {
  const top = models[0];
  if (!top || top.shareOfTotalTokens < DOMINANT_MODEL_SHARE_THRESHOLD) return null;

  return {
    id: 'dominant-model',
    severity: 'info',
    message: `You mainly use ${top.displayName} (${toPercent(top.shareOfTotalTokens)}% of tokens).`,
  };
}

function buildDominantProjectInsight(projects: ProjectUsageBreakdown[]): Insight | null {
  const top = projects[0];
  if (!top || top.shareOfTotalTokens < DOMINANT_PROJECT_SHARE_THRESHOLD) return null;

  return {
    id: 'dominant-project',
    severity: 'info',
    message: `${top.projectName} consumes ${toPercent(top.shareOfTotalTokens)}% of all tokens.`,
  };
}

function buildHaikuSavingsInsight(turns: ResolvedTurn[]): Insight | null {
  if (turns.length === 0) return null;

  let actualCost = 0;
  let haikuEquivalentCost = 0;
  let nonHaikuTokens = 0;

  for (const turn of turns) {
    actualCost += turn.costUsd;
    haikuEquivalentCost += calculateCostForFamily('haiku', turn.tokens);
  }

  for (const turn of turns) {
    if (!/haiku/i.test(turn.model)) nonHaikuTokens += turn.totalTokens;
  }

  if (actualCost <= 0 || nonHaikuTokens === 0) return null;

  const savingsShare = 1 - haikuEquivalentCost / actualCost;
  if (savingsShare < MEANINGFUL_HAIKU_SAVINGS_THRESHOLD) return null;

  return {
    id: 'haiku-savings',
    severity: 'tip',
    message: `Consider using Haiku for simple tasks — it could reduce your cost by up to ${toPercent(savingsShare)}%.`,
  };
}

function buildLargeSessionInsight(summary: UsageSummary, sessionTokensBySessionId: Map<string, number>): Insight | null {
  if (summary.totalSessions < MIN_SESSIONS_FOR_LARGE_SESSION_INSIGHT || summary.averageSessionTokens <= 0) return null;

  let largestTokens = 0;
  for (const tokens of sessionTokensBySessionId.values()) {
    if (tokens > largestTokens) largestTokens = tokens;
  }

  const multiple = largestTokens / summary.averageSessionTokens;
  if (multiple < LARGE_SESSION_MULTIPLE_THRESHOLD) return null;

  return {
    id: 'large-session',
    severity: 'warning',
    message: `Your largest session used ${largestTokens.toLocaleString()} tokens — about ${multiple.toFixed(1)}x your average session.`,
  };
}

export function generateInsights(
  turns: ResolvedTurn[],
  summary: UsageSummary,
  models: ModelUsageBreakdown[],
  projects: ProjectUsageBreakdown[],
): Insight[] {
  if (summary.totalSessions === 0) {
    return [
      {
        id: 'no-data',
        severity: 'info',
        message: 'No usage data yet — start a Claude Code session to see analytics here.',
      },
    ];
  }

  const tokensBySessionId = new Map<string, number>();
  for (const turn of turns) {
    tokensBySessionId.set(turn.sessionId, (tokensBySessionId.get(turn.sessionId) ?? 0) + turn.totalTokens);
  }

  const insights = [
    buildDominantModelInsight(models),
    buildDominantProjectInsight(projects),
    buildHaikuSavingsInsight(turns),
    buildLargeSessionInsight(summary, tokensBySessionId),
  ].filter((insight): insight is Insight => insight !== null);

  if (insights.length === 0) {
    insights.push({ id: 'balanced-usage', severity: 'info', message: 'Your usage looks balanced across models and projects.' });
  }

  return insights;
}
