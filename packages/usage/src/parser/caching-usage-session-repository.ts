import { stat } from 'node:fs/promises';
import type { ClaudeHomeOptions, LoadAllSessionsResult, ParseWarning, SessionRecord } from '../types/index.js';
import { ClaudeHomeLocator } from '../utils/claude-home.js';
import { SessionFileDiscovery } from './session-file-discovery.js';
import { SessionFileParser } from './session-file-parser.js';

interface CacheEntry {
  mtimeMs: number;
  /** Null when the file contained no real token usage — cached so unchanged files stay cheap. */
  session: SessionRecord | null;
  warnings: ParseWarning[];
}

/**
 * Same contract as UsageSessionRepository, but skips re-parsing any session file whose
 * mtime hasn't changed since the last call. Session files only ever grow by appending —
 * mtime is a cheap, reliable enough signal for "did this file change" here.
 *
 * Built for a UI that polls every couple of seconds: without this, every poll would
 * re-read and re-parse every session file on disk from scratch, and that cost only grows
 * as history accumulates. A `stat()` per file is cheap; re-streaming a multi-MB `.jsonl`
 * line-by-line every 2 seconds is not.
 */
export class CachingUsageSessionRepository {
  private readonly cache = new Map<string, CacheEntry>();

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
      this.cache.clear();
      return { sessions: [], warnings: [], claudeHomeDir, historyFound: false, totalFilesScanned: 0, lastScanAt: new Date().toISOString() };
    }

    const sessions: SessionRecord[] = [];
    const warnings: ParseWarning[] = [];
    const seenPaths = new Set<string>();

    for (const file of files) {
      seenPaths.add(file.filePath);

      let mtimeMs: number;
      try {
        mtimeMs = (await stat(file.filePath)).mtimeMs;
      } catch (error) {
        warnings.push({ file: file.filePath, line: 0, message: error instanceof Error ? error.message : 'Failed to stat session file.' });
        continue;
      }

      const cached = this.cache.get(file.filePath);
      if (cached && cached.mtimeMs === mtimeMs) {
        if (cached.session) sessions.push(cached.session);
        warnings.push(...cached.warnings);
        continue;
      }

      try {
        const outcome = await this.parser.parse(file.filePath, file.projectDirName, file.sessionId);
        this.cache.set(file.filePath, { mtimeMs, session: outcome.session, warnings: outcome.warnings });
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

    // Drop entries for files that disappeared since the last scan (deleted/moved sessions).
    for (const cachedPath of this.cache.keys()) {
      if (!seenPaths.has(cachedPath)) this.cache.delete(cachedPath);
    }

    return { sessions, warnings, claudeHomeDir, historyFound: true, totalFilesScanned: files.length, lastScanAt: new Date().toISOString() };
  }
}
