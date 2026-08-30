import type { ModelFamily } from '../models/model-catalog.js';

export interface UsageWindowStats {
  totalTokens: number;
  totalCostUsd: number;
  sessionCount: number;
}

export interface UsageSummary {
  totalSessions: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCacheReadTokens: number;
  totalCacheCreationTokens: number;
  totalTokens: number;
  totalCostUsd: number;
  averageSessionTokens: number;
  mostUsedModel: string | null;
  mostActiveProject: string | null;
  today: UsageWindowStats;
  last7Days: UsageWindowStats;
  last30Days: UsageWindowStats;
  lifetime: UsageWindowStats;
}

export interface TrendPoint {
  /** ISO date (day bucket) or ISO date of the week's start (week bucket). */
  date: string;
  totalTokens: number;
  totalCostUsd: number;
  sessionCount: number;
}

export interface UsageTrends {
  daily: TrendPoint[];
  weekly: TrendPoint[];
}

/** Preset time ranges the dashboard filter offers. */
export type RangeOption = '7d' | '30d' | '90d' | 'all';

export interface ModelUsageBreakdown {
  /** Exact model id stored in the session files, e.g. "claude-sonnet-5". */
  model: string;
  /** Family this model belongs to (haiku/sonnet/opus/unknown) — used for consistent colors. */
  family: ModelFamily;
  displayName: string;
  totalTokens: number;
  totalCostUsd: number;
  sessionCount: number;
  /** 0..1 share of total tokens across all models. */
  shareOfTotalTokens: number;
}

export interface ProjectUsageBreakdown {
  projectPath: string;
  projectName: string;
  totalTokens: number;
  totalCostUsd: number;
  sessionCount: number;
  lastActivity: string | null;
  /** 0..1 share of total tokens across all projects. */
  shareOfTotalTokens: number;
}

export interface SessionSummaryRow {
  sessionId: string;
  date: string;
  projectName: string;
  projectPath: string;
  primaryModel: string;
  primaryModelDisplayName: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheCreationTokens: number;
  totalTokens: number;
  totalCostUsd: number;
  title: string | null;
  /** True when the user hid this session from the dashboard. Hidden rows are excluded from every other analytics view. */
  hidden?: boolean;
}

export type InsightSeverity = 'info' | 'tip' | 'warning';

export interface Insight {
  id: string;
  message: string;
  severity: InsightSeverity;
}
