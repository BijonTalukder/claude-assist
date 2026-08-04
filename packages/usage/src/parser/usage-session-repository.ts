import type { ClaudeHomeOptions, LoadAllSessionsResult, ParseWarning, SessionRecord } from '../types/index.js';
import { ClaudeHomeLocator } from '../utils/claude-home.js';
import { SessionFileDiscovery } from './session-file-discovery.js';
import { SessionFileParser } from './session-file-parser.js';

/**
 * The single entry point for reading Claude Code's local history. Never
 * throws on missing or partial history — a fresh machine with no sessions
 * yet is a normal, expected state, not an error.
 */
export class UsageSessionRepository {
  constructor(
    private readonly homeLocator: ClaudeHomeLocator = new ClaudeHomeLocator(),
    private readonly discovery: SessionFileDiscovery = new SessionFileDiscovery(),
    private readonly parser: SessionFileParser = new SessionFileParser(),
  ) {}

  async loadAll(options: ClaudeHomeOptions = {}): Promise<LoadAllSessionsResult> {
    const claudeHomeDir = this.homeLocator.resolve(options);
    const projectsDir = this.homeLocator.resolveProjectsDir(options);

    const files = await this.discovery.discover(projectsDir);
    if (files.length === 0) {
      return { sessions: [], warnings: [], claudeHomeDir, historyFound: false, totalFilesScanned: 0, lastScanAt: new Date().toISOString() };
    }

    const sessions: SessionRecord[] = [];
    const warnings: ParseWarning[] = [];

    for (const file of files) {
      try {
        const outcome = await this.parser.parse(file.filePath, file.projectDirName, file.sessionId);
        if (outcome.session) sessions.push(outcome.session);
        warnings.push(...outcome.warnings);
      } catch (error) {
        warnings.push({
          file: file.filePath,
          line: 0,
          message: error instanceof Error ? error.message : 'Failed to read session file.',
        });
      }
    }

    return { sessions, warnings, claudeHomeDir, historyFound: true, totalFilesScanned: files.length, lastScanAt: new Date().toISOString() };
  }
}
