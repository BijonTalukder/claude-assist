import type { Insight, ModelUsageBreakdown, ProjectUsageBreakdown, RangeOption, SessionSummaryRow, UsageSummary, UsageTrends } from '@claude-assist/usage';

interface ApiMeta {
  range: RangeOption;
  claudeInstalled: boolean;
  isMockData: boolean;
  generatedAt: string;
}

export interface SummaryResponse extends ApiMeta {
  summary: UsageSummary;
}
export interface TrendsResponse extends ApiMeta {
  trends: UsageTrends;
}
export interface ModelsResponse extends ApiMeta {
  models: ModelUsageBreakdown[];
}
export interface ProjectsResponse extends ApiMeta {
  projects: ProjectUsageBreakdown[];
}
export interface SessionsResponse extends ApiMeta {
  sessions: SessionSummaryRow[];
}
export interface InsightsResponse extends ApiMeta {
  insights: Insight[];
}
export interface StatusResponse {
  installed: boolean;
  directory: string | null;
  lastScanAt: string | null;
  totalFilesScanned: number;
  totalSessionsParsed: number;
}

/** Combined shape the Overview page actually renders — one poll, two endpoints. */
export interface OverviewResponse {
  summary: UsageSummary;
  insights: Insight[];
  range: RangeOption;
  claudeInstalled: boolean;
  isMockData: boolean;
  generatedAt: string;
}

export const RANGE_OPTIONS: RangeOption[] = ['7d', '30d', '90d', 'all'];

export const RANGE_LABELS: Record<RangeOption, string> = {
  '7d': '7 days',
  '30d': '30 days',
  '90d': '90 days',
  all: 'All time',
};

const API_BASE = '/api/analytics';

async function getJson<T>(path: string, range: RangeOption): Promise<T> {
  const response = await fetch(`${API_BASE}${path}?range=${encodeURIComponent(range)}`);
  if (!response.ok) {
    throw new Error(`Request to ${path} failed with status ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export const analyticsApi = {
  getSummary: (range: RangeOption = 'all') => getJson<SummaryResponse>('/summary', range),
  getTrends: (range: RangeOption = 'all') => getJson<TrendsResponse>('/trends', range),
  getModels: (range: RangeOption = 'all') => getJson<ModelsResponse>('/models', range),
  getProjects: (range: RangeOption = 'all') => getJson<ProjectsResponse>('/projects', range),
  getSessions: (range: RangeOption = 'all') => getJson<SessionsResponse>('/sessions', range),
  getInsights: (range: RangeOption = 'all') => getJson<InsightsResponse>('/insights', range),
  getStatus: () => getJson<StatusResponse>('/status', 'all'),
  getOverview: async (range: RangeOption = 'all'): Promise<OverviewResponse> => {
    const [summaryRes, insightsRes] = await Promise.all([getJson<SummaryResponse>('/summary', range), getJson<InsightsResponse>('/insights', range)]);
    return {
      summary: summaryRes.summary,
      insights: insightsRes.insights,
      range: summaryRes.range,
      claudeInstalled: summaryRes.claudeInstalled,
      isMockData: summaryRes.isMockData,
      generatedAt: summaryRes.generatedAt,
    };
  },
};
