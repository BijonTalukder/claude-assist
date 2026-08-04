import { existsSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

export interface ClaudeDirectoryCandidate {
  path: string;
  exists: boolean;
  mtimeMs: number | null;
}

export interface ClaudeDirectoryResolution {
  found: boolean;
  directory: string | null;
  candidates: ClaudeDirectoryCandidate[];
}

export interface ResolveOptions {
  env?: NodeJS.ProcessEnv;
  platform?: NodeJS.Platform;
}

function uniquePaths(paths: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const path of paths) {
    if (!path || seen.has(path)) continue;
    seen.add(path);
    result.push(path);
  }
  return result;
}

function buildCandidatePaths(env: NodeJS.ProcessEnv, platform: NodeJS.Platform): string[] {
  const home = env.HOME ?? env.USERPROFILE ?? homedir();

  if (platform === 'win32') {
    return uniquePaths([
      env.APPDATA ? join(env.APPDATA, 'Claude') : null,
      env.LOCALAPPDATA ? join(env.LOCALAPPDATA, 'Claude') : null,
      env.USERPROFILE ? join(env.USERPROFILE, '.claude') : null,
      join(home, '.claude'),
    ]);
  }

  if (platform === 'darwin') {
    return uniquePaths([
      join(home, 'Library', 'Application Support', 'Claude'),
      join(home, '.claude'),
      env.XDG_CONFIG_HOME ? join(env.XDG_CONFIG_HOME, 'claude') : null,
    ]);
  }

  // linux and anything else POSIX-like
  return uniquePaths([
    join(home, '.claude'),
    env.XDG_CONFIG_HOME ? join(env.XDG_CONFIG_HOME, 'claude') : join(home, '.config', 'claude'),
    env.XDG_DATA_HOME ? join(env.XDG_DATA_HOME, 'claude') : join(home, '.local', 'share', 'claude'),
  ]);
}

/** A directory only counts as a real Claude install if it actually has Claude data in it — an unrelated empty folder named "claude" shouldn't win. */
function looksLikeClaudeDirectory(path: string): boolean {
  return existsSync(join(path, 'projects')) || existsSync(join(path, 'settings.json')) || existsSync(join(path, 'history.jsonl'));
}

/** Locates Claude Code's local data directory across Linux/macOS/Windows without assuming a single path. */
export class ClaudeDirectoryResolver {
  resolve(options: ResolveOptions = {}): ClaudeDirectoryResolution {
    const env = options.env ?? process.env;
    const platform = options.platform ?? process.platform;

    const candidates: ClaudeDirectoryCandidate[] = buildCandidatePaths(env, platform).map((path) => {
      const exists = existsSync(path) && looksLikeClaudeDirectory(path);
      let mtimeMs: number | null = null;
      if (exists) {
        try {
          mtimeMs = statSync(path).mtimeMs;
        } catch {
          mtimeMs = null;
        }
      }
      return { path, exists, mtimeMs };
    });

    const valid = candidates.filter((candidate) => candidate.exists);
    if (valid.length === 0) {
      return { found: false, directory: null, candidates };
    }

    // Multiple real installs (e.g. leftover from a reinstall under a different path): prefer the most recently touched one.
    const newest = valid.reduce((best, current) => ((current.mtimeMs ?? 0) > (best.mtimeMs ?? 0) ? current : best));
    return { found: true, directory: newest.path, candidates };
  }
}
