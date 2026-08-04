export type {
  ClaudeHomeOptions,
  LoadAllSessionsResult,
  ParseWarning,
  SessionParseResult,
  SessionRecord,
  TurnDuration,
  UsageTokens,
  UsageTurn,
} from './types/index.js';

export { ClaudeHomeLocator } from './utils/claude-home.js';
export { ClaudeDirectoryResolver } from './utils/claude-directory-resolver.js';
export type { ClaudeDirectoryCandidate, ClaudeDirectoryResolution, ResolveOptions } from './utils/claude-directory-resolver.js';

export { SessionFileDiscovery } from './parser/session-file-discovery.js';
export type { DiscoveredSessionFile } from './parser/session-file-discovery.js';

export { ClaudeFileScanner } from './parser/claude-file-scanner.js';
export type { ClaudeFileKind, DiscoveredClaudeFile } from './parser/claude-file-scanner.js';

export { SessionFileParser } from './parser/session-file-parser.js';
export type { SessionParseOutcome } from './parser/session-file-parser.js';

export { UsageSessionRepository } from './parser/usage-session-repository.js';
export { CachingUsageSessionRepository } from './parser/caching-usage-session-repository.js';

export type {
  Insight,
  InsightSeverity,
  ModelUsageBreakdown,
  ProjectUsageBreakdown,
  SessionSummaryRow,
  TrendPoint,
  UsageSummary,
  UsageTrends,
  UsageWindowStats,
} from './types/analytics.js';

export { resolveModel } from './models/model-catalog.js';
export type { ModelCatalogEntry, ModelFamily } from './models/model-catalog.js';

export { PRICING_TABLE } from './pricing/pricing-table.js';
export type { ModelPricing } from './pricing/pricing-table.js';
export { calculateCostForFamily, calculateCostForModel, calculateCostUsd } from './pricing/cost-calculator.js';

export { resolveTurns } from './analytics/resolved-turn.js';
export type { ResolvedTurn } from './analytics/resolved-turn.js';
export { UsageAnalyticsEngine } from './analytics/usage-analytics-engine.js';
export type { UsageAnalyticsBundle } from './analytics/usage-analytics-engine.js';

export { generateMockSessions } from './mock/mock-session-generator.js';
