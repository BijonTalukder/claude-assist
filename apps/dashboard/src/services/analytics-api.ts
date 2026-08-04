import type { Insight, ModelUsageBreakdown, ProjectUsageBreakdown, SessionSummaryRow, UsageSummary, UsageTrends } from '@claude-assist/usage';

interface ApiMeta {
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
  isMockData: boolean;
  generatedAt: string;
}

const API_BASE = '/api/analytics';

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`);
  if (!response.ok) {
    throw new Error(`Request to ${path} failed with status ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export const analyticsApi = {
  getSummary: () => getJson<SummaryResponse>('/summary'),
  getTrends: () => getJson<TrendsResponse>('/trends'),
  getModels: () => getJson<ModelsResponse>('/models'),
  getProjects: () => getJson<ProjectsResponse>('/projects'),
  getSessions: () => getJson<SessionsResponse>('/sessions'),
  getInsights: () => getJson<InsightsResponse>('/insights'),
  getStatus: () => getJson<StatusResponse>('/status'),
  getOverview: async (): Promise<OverviewResponse> => {
    const [summaryRes, insightsRes] = await Promise.all([getJson<SummaryResponse>('/summary'), getJson<InsightsResponse>('/insights')]);
    return { summary: summaryRes.summary, insights: insightsRes.insights, isMockData: summaryRes.isMockData, generatedAt: summaryRes.generatedAt };
  },
};
