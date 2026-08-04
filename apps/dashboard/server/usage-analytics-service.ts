import {
  CachingUsageSessionRepository,
  ClaudeDirectoryResolver,
  UsageAnalyticsEngine,
  filterSessionsByDate,
  filterSessionsByRange,
  RANGE_DAYS,
  generateMockSessions,
  type LoadAllSessionsResult,
  type RangeOption,
  type SessionRecord,
  type TrendWindow,
  type UsageAnalyticsBundle,
} from '@claude-assist/usage';

export interface AnalyticsSnapshot extends UsageAnalyticsBundle {
  /** The time range the snapshot was computed over. */
  range: RangeOption;
  /** True when Claude Code is installed locally (its data directory was found). */
  claudeInstalled: boolean;
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

  /** `date`, when given, is a UTC calendar day ("YYYY-MM-DD") — see filterSessionsByDate. */
  async getSnapshot(options: { date?: string; range?: RangeOption } = {}): Promise<AnalyticsSnapshot> {
    const now = new Date();
    const result = await this.repository.loadAll();
    this.lastLoadResult = result;

    const claudeInstalled = this.directoryResolver.resolve().found;

    // If Claude Code isn't installed there is no local history to show, so don't
    // fabricate sample data — the UI surfaces a "not detected" notice instead.
    // Mock data is only offered as a preview when Claude is installed but has no
    // history yet.
    let sourceSessions: SessionRecord[];
    let isMockData: boolean;

    if (!claudeInstalled) {
      sourceSessions = result.sessions;
      isMockData = false;
    } else {
      isMockData = !(result.historyFound && result.sessions.length > 0);
      sourceSessions = isMockData ? generateMockSessions(now) : result.sessions;
    }

    // Filters are applied after the mock-data decision above, so picking a day/range
    // never flips a real-but-empty-that-period account into showing sample data.
    const range = options.range ?? 'all';
    const filtered = options.date
      ? filterSessionsByDate(sourceSessions, options.date)
      : filterSessionsByRange(sourceSessions, range, now);

    const trendWindow = trendWindowForRange(range);
    const bundle = this.engine.buildAll(filtered, now, trendWindow);

    return { ...bundle, range, claudeInstalled, isMockData, generatedAt: now.toISOString() };
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

/** Trend chart window for a range — matches the sessions the range filter keeps. */
function trendWindowForRange(range: RangeOption): TrendWindow {
  const days = RANGE_DAYS[range];
  if (!Number.isFinite(days)) {
    return { dailyDays: 30, weeklyWeeks: 12 };
  }
  return {
    dailyDays: days,
    weeklyWeeks: Math.min(12, Math.max(2, Math.ceil(days / 7))),
  };
}
