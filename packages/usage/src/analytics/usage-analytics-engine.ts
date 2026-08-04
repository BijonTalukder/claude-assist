import type { SessionRecord } from '../types/index.js';
import type { Insight, ModelUsageBreakdown, ProjectUsageBreakdown, SessionSummaryRow, UsageSummary, UsageTrends } from '../types/analytics.js';
import { resolveTurns } from './resolved-turn.js';
import { buildSummary } from './build-summary.js';
import { buildTrends, DEFAULT_TREND_WINDOW, type TrendWindow } from './build-trends.js';
import { buildModelBreakdown } from './build-model-breakdown.js';
import { buildProjectBreakdown } from './build-project-breakdown.js';
import { buildSessionRows } from './build-session-rows.js';
import { generateInsights } from './insights-generator.js';

export interface UsageAnalyticsBundle {
  summary: UsageSummary;
  trends: UsageTrends;
  models: ModelUsageBreakdown[];
  projects: ProjectUsageBreakdown[];
  sessions: SessionSummaryRow[];
  insights: Insight[];
}

/**
 * Single entry point for turning parsed session files into every analytics view the
 * dashboard needs. Turns are resolved (cost-calculated) once and shared across all
 * builders, so cost logic lives in exactly one place.
 */
export class UsageAnalyticsEngine {
  buildAll(sessions: SessionRecord[], now: Date = new Date(), trendWindow: TrendWindow = DEFAULT_TREND_WINDOW): UsageAnalyticsBundle {
    const turns = resolveTurns(sessions);

    const summary = buildSummary(turns, now);
    const trends = buildTrends(turns, now, trendWindow);
    const models = buildModelBreakdown(turns);
    const projects = buildProjectBreakdown(turns);
    const sessionRows = buildSessionRows(sessions, turns);
    const insights = generateInsights(turns, summary, models, projects);

    return { summary, trends, models, projects, sessions: sessionRows, insights };
  }
}
