import {
  buildSessionRows,
  CachingUsageSessionRepository,
  ClaudeDirectoryResolver,
  ClaudeHomeLocator,
  UsageAnalyticsEngine,
  filterSessionsByDate,
  filterSessionsByRange,
  RANGE_DAYS,
  generateMockSessions,
  resolveTurns,
  type LoadAllSessionsResult,
  type RangeOption,
  type SessionRecord,
  type TrendWindow,
  type UsageAnalyticsBundle,
} from '@claude-assist/usage';
import { HIDDEN_SESSIONS_FILE } from './config.js';
import { HiddenSessionStore } from './hidden-session-store.js';
import { deleteSessionFile, SessionDeleteError } from './delete-session-file.js';

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
  hiddenSessions: number;
}

export interface SnapshotOptions {
  date?: string;
  range?: RangeOption;
  /**
   * Appends hidden sessions to the session list (flagged `hidden: true`) so the UI can
   * offer an unhide. They stay out of every other view — that is what hiding means.
   */
  includeHidden?: boolean;
}

/** Raised for mutations that cannot apply to the session the client named. */
export class SessionMutationError extends Error {
  constructor(
    readonly reason: 'not-found' | 'mock-data' | 'session-active' | 'file-in-use' | 'outside-claude-directory',
    message: string,
  ) {
    super(message);
    this.name = 'SessionMutationError';
  }
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
    private readonly hiddenSessions: HiddenSessionStore = new HiddenSessionStore(HIDDEN_SESSIONS_FILE),
    private readonly homeLocator: ClaudeHomeLocator = new ClaudeHomeLocator(),
  ) {}

  /** `date`, when given, is a UTC calendar day ("YYYY-MM-DD") — see filterSessionsByDate. */
  async getSnapshot(options: SnapshotOptions = {}): Promise<AnalyticsSnapshot> {
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

    // Hidden sessions are removed before anything is computed, so they affect no total,
    // trend or breakdown. Mock data has no real session ids behind it, so nothing to hide.
    const hiddenIds = isMockData ? new Set<string>() : new Set(this.hiddenSessions.list());
    const visibleSessions = hiddenIds.size === 0 ? sourceSessions : sourceSessions.filter((s) => !hiddenIds.has(s.sessionId));

    // Filters are applied after the mock-data decision above, so picking a day/range
    // never flips a real-but-empty-that-period account into showing sample data.
    const range = options.range ?? 'all';
    const applyFilters = (sessions: SessionRecord[]): SessionRecord[] =>
      options.date ? filterSessionsByDate(sessions, options.date) : filterSessionsByRange(sessions, range, now);

    const filtered = applyFilters(visibleSessions);
    const trendWindow = trendWindowForRange(range);
    const bundle = this.engine.buildAll(filtered, now, trendWindow);

    const sessions =
      options.includeHidden && hiddenIds.size > 0
        ? [...bundle.sessions, ...this.buildHiddenRows(applyFilters(sourceSessions.filter((s) => hiddenIds.has(s.sessionId))))]
        : bundle.sessions;

    return { ...bundle, sessions, range, claudeInstalled, isMockData, generatedAt: now.toISOString() };
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
      hiddenSessions: this.hiddenSessions.list().length,
    };
  }

  /** Reversible: drops the session from analytics without touching its transcript. */
  async hideSession(sessionId: string): Promise<void> {
    await this.requireRealSession(sessionId);
    this.hiddenSessions.hide(sessionId);
  }

  async unhideSession(sessionId: string): Promise<void> {
    // No existence check: unhiding a session whose file has since vanished must still
    // clear the stored id, otherwise the entry is unreachable forever.
    this.hiddenSessions.unhide(sessionId);
  }

  /**
   * Permanently deletes the session's transcript from Claude Code's own data directory.
   * This is not reversible and the session stops being resumable in Claude Code.
   */
  async deleteSession(sessionId: string, options: { force?: boolean } = {}): Promise<void> {
    const record = await this.requireRealSession(sessionId);

    try {
      await deleteSessionFile(record.sourceFile, this.homeLocator.resolveProjectsDir(), { force: options.force });
    } catch (error) {
      if (error instanceof SessionDeleteError) {
        throw new SessionMutationError(error.reason, error.message);
      }
      throw error;
    }

    // The id can never match a session again, so don't leave it in the hidden list.
    this.hiddenSessions.forget(sessionId);
    // Force the next poll to re-scan rather than serve the deleted session from cache.
    this.lastLoadResult = null;
  }

  /**
   * Resolves a session id against what the repository actually parsed. Mutations only
   * ever act on records found this way — a client-supplied path is never trusted.
   */
  private async requireRealSession(sessionId: string): Promise<SessionRecord> {
    const result = await this.repository.loadAll();
    this.lastLoadResult = result;

    if (!(result.historyFound && result.sessions.length > 0)) {
      throw new SessionMutationError('mock-data', 'There is no local Claude Code history to modify.');
    }

    const record = result.sessions.find((session) => session.sessionId === sessionId);
    if (!record) {
      throw new SessionMutationError('not-found', `No session found with id ${sessionId}.`);
    }
    return record;
  }

  private buildHiddenRows(sessions: SessionRecord[]) {
    if (sessions.length === 0) return [];
    return buildSessionRows(sessions, resolveTurns(sessions)).map((row) => ({ ...row, hidden: true }));
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
