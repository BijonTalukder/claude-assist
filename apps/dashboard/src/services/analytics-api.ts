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
  hiddenSessions: number;
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

async function getJson<T>(path: string, range: RangeOption, params: Record<string, string> = {}): Promise<T> {
  const query = new URLSearchParams({ range, ...params });
  const response = await fetch(`${API_BASE}${path}?${query.toString()}`);
  if (!response.ok) {
    throw new Error(`Request to ${path} failed with status ${response.status}`);
  }
  return response.json() as Promise<T>;
}

/** Why a hide/delete was refused — mirrors SessionMutationError on the server. */
export type SessionMutationReason = 'not-found' | 'mock-data' | 'session-active' | 'file-in-use' | 'outside-claude-directory';

export class SessionMutationFailed extends Error {
  constructor(
    readonly reason: SessionMutationReason | null,
    message: string,
  ) {
    super(message);
    this.name = 'SessionMutationFailed';
  }
}

/**
 * Mutations return 204 with no body on success. A refusal carries `{ error, reason }`,
 * and the reason is what lets the UI offer the right follow-up (e.g. force-delete an
 * apparently-active session) instead of just reporting a status code.
 */
async function mutate(path: string, method: 'POST' | 'DELETE'): Promise<void> {
  const response = await fetch(`${API_BASE}${path}`, { method });
  if (response.ok) return;

  const body = (await response.json().catch(() => null)) as { error?: string; reason?: SessionMutationReason } | null;
  throw new SessionMutationFailed(body?.reason ?? null, body?.error ?? `Request failed with status ${response.status}`);
}

export const analyticsApi = {
  getSummary: (range: RangeOption = 'all') => getJson<SummaryResponse>('/summary', range),
  getTrends: (range: RangeOption = 'all') => getJson<TrendsResponse>('/trends', range),
  getModels: (range: RangeOption = 'all') => getJson<ModelsResponse>('/models', range),
  getProjects: (range: RangeOption = 'all') => getJson<ProjectsResponse>('/projects', range),
  getSessions: (range: RangeOption = 'all', includeHidden = false) =>
    getJson<SessionsResponse>('/sessions', range, includeHidden ? { includeHidden: '1' } : {}),
  getInsights: (range: RangeOption = 'all') => getJson<InsightsResponse>('/insights', range),
  getStatus: () => getJson<StatusResponse>('/status', 'all'),
  hideSession: (sessionId: string) => mutate(`/sessions/${encodeURIComponent(sessionId)}/hide`, 'POST'),
  unhideSession: (sessionId: string) => mutate(`/sessions/${encodeURIComponent(sessionId)}/hide`, 'DELETE'),
  /** Permanent. `force` overrides the server's guard against deleting a still-active session. */
  deleteSession: (sessionId: string, force = false) =>
    mutate(`/sessions/${encodeURIComponent(sessionId)}${force ? '?force=1' : ''}`, 'DELETE'),
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
