import { readdir, stat } from 'node:fs/promises';
import { extname, join } from 'node:path';

export type ClaudeFileKind = 'session-jsonl' | 'sqlite' | 'json' | 'unknown';

export interface DiscoveredClaudeFile {
  filePath: string;
  kind: ClaudeFileKind;
  mtimeMs: number;
}

// Marketplace/plugin clones, caches, logs, and UI scratch dirs live under ~/.claude too —
// none of it is usage data, and some of it (plugins/) is large enough to make an
// unbounded recursive scan slow for no benefit.
const IGNORED_DIR_NAMES = new Set([
  'node_modules',
  'cache',
  'caches',
  'tmp',
  'temp',
  'logs',
  'log',
  'thumbnails',
  'plugins',
  'downloads',
  'shell-snapshots',
  'ide',
  'file-history',
  'paste-cache',
  'session-env',
  'backups',
]);

const DEFAULT_MAX_DEPTH = 6;

function detectKind(fileName: string): ClaudeFileKind {
  const ext = extname(fileName).toLowerCase();
  if (ext === '.jsonl') return 'session-jsonl';
  if (ext === '.db' || ext === '.sqlite' || ext === '.sqlite3') return 'sqlite';
  if (ext === '.json') return 'json';
  return 'unknown';
}

/**
 * Recursively walks a Claude data directory looking for session/history data in any
 * recognized format, without assuming exact filenames. General-purpose and reusable —
 * not tied to the `projects/*.jsonl` layout specifically, so a future format (or a
 * different Claude Code version's layout) just needs a new case in `detectKind`.
 */
export class ClaudeFileScanner {
  async scan(rootDir: string, maxDepth: number = DEFAULT_MAX_DEPTH): Promise<DiscoveredClaudeFile[]> {
    const results: DiscoveredClaudeFile[] = [];
    await this.walk(rootDir, 0, maxDepth, results);
    return results;
  }

  private async walk(dir: string, depth: number, maxDepth: number, results: DiscoveredClaudeFile[]): Promise<void> {
    if (depth > maxDepth) return;

    const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        if (IGNORED_DIR_NAMES.has(entry.name.toLowerCase())) continue;
        await this.walk(fullPath, depth + 1, maxDepth, results);
        continue;
      }

      if (!entry.isFile()) continue;

      const kind = detectKind(entry.name);
      if (kind === 'unknown') continue;

      const mtimeMs = await stat(fullPath)
        .then((s) => s.mtimeMs)
        .catch(() => 0);
      results.push({ filePath: fullPath, kind, mtimeMs });
    }
  }
}
