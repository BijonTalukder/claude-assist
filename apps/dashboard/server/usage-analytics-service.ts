import {
  CachingUsageSessionRepository,
  ClaudeDirectoryResolver,
  UsageAnalyticsEngine,
  generateMockSessions,
  type LoadAllSessionsResult,
  type UsageAnalyticsBundle,
} from '@claude-assist/usage';

export interface AnalyticsSnapshot extends UsageAnalyticsBundle {
  /** True when no local Claude Code history was found and this is sample data instead. */
  isMockData: boolean;
  generatedAt: string;
}

export interface ClaudeInstallationStatus {
  installed: boolean;
  directory: string | null;
  lastScanAt: string | null;
  totalFilesScanned: number;
  totalSessionsParsed: number;
}

/**
 * The one place the dashboard's API routes go to get data. Uses the caching repository
 * so the 2-second poll only re-parses session files that actually changed, not the
 * whole history on every request.
 */
export class UsageAnalyticsService {
  private lastLoadResult: LoadAllSessionsResult | null = null;

  constructor(
    private readonly repository: CachingUsageSessionRepository = new CachingUsageSessionRepository(),
    private readonly engine: UsageAnalyticsEngine = new UsageAnalyticsEngine(),
    private readonly directoryResolver: ClaudeDirectoryResolver = new ClaudeDirectoryResolver(),
  ) {}

  async getSnapshot(): Promise<AnalyticsSnapshot> {
    const now = new Date();
    const result = await this.repository.loadAll();
    this.lastLoadResult = result;

    const isMockData = !result.historyFound || result.sessions.length === 0;
    const sourceSessions = isMockData ? generateMockSessions(now) : result.sessions;

    const bundle = this.engine.buildAll(sourceSessions, now);

    return { ...bundle, isMockData, generatedAt: now.toISOString() };
  }

  async getStatus(): Promise<ClaudeInstallationStatus> {
    const resolution = this.directoryResolver.resolve();
    const result = this.lastLoadResult ?? (await this.repository.loadAll());
    this.lastLoadResult = result;

    return {
      installed: resolution.found,
      directory: resolution.directory,
      lastScanAt: result.lastScanAt,
      totalFilesScanned: result.totalFilesScanned,
      totalSessionsParsed: result.sessions.length,
    };
  }
}
