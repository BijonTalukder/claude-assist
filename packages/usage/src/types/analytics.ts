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

export interface ModelUsageBreakdown {
  model: string;
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
  totalCostUsd: number;
  title: string | null;
}

export type InsightSeverity = 'info' | 'tip' | 'warning';

export interface Insight {
  id: string;
  message: string;
  severity: InsightSeverity;
}
