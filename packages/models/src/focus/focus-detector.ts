import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { FocusArea, GitInfo, RecommendationInput } from '@claude-assist/types';

const WORKSPACE_ROOT_MARKERS = ['pnpm-workspace.yaml', 'lerna.json', 'turbo.json', 'nx.json'];

export interface FocusDetectorOptions {
  /** Highest-priority scope the user explicitly selected (e.g. "apps/api"). */
  userSelection?: string;
}

const NO_FOCUS_SCOPE =
  'No clear focus area detected. Recommend working only on files related to the user\'s request.';

const FOCUS_ON_MODIFIED_DIRECTORIES =
  'Focus primarily on the modified directories unless the user\'s request requires broader changes.';

const FOCUS_ON_MODIFIED_FILES =
  'Focus primarily on the modified files unless the user\'s request requires broader changes.';

/**
 * Determines where Claude's attention should be directed before it launches,
 * using only factual project metadata. Priority order:
 *
 *   1. user-selected scope (explicit, highest),
 *   2. current working directory when it is a workspace package,
 *   3. directories touched by uncommitted git changes,
 *   4. the enclosing monorepo when no git evidence exists,
 *   5. "no clear focus" — never guessing module names.
 */
export class FocusDetector {
  detect(input: RecommendationInput, options: FocusDetectorOptions = {}): FocusArea {
    const workingDirectory = input.project.rootPath;
    const changedDirectories = groupChangedDirectories(input.git);
    const monorepoRoot = findMonorepoRoot(workingDirectory);

    if (options.userSelection) {
      return {
        source: 'user',
        workingDirectory,
        changedDirectories,
        recommendedScope: `Focus on ${options.userSelection}.`,
        confidence: 'high',
      };
    }

    if (monorepoRoot !== null && monorepoRoot !== workingDirectory) {
      return {
        source: 'cwd',
        workingDirectory,
        package: readPackageName(workingDirectory) ?? undefined,
        changedDirectories,
        recommendedScope: `Focus on ${workingDirectory}.`,
        confidence: 'high',
      };
    }

    if (input.git.isRepo && input.git.changedFiles > 0) {
      return {
        source: 'git',
        workingDirectory,
        changedDirectories,
        recommendedScope:
          changedDirectories.length > 0 ? FOCUS_ON_MODIFIED_DIRECTORIES : FOCUS_ON_MODIFIED_FILES,
        confidence: 'medium',
      };
    }

    if (monorepoRoot !== null) {
      return {
        source: 'workspace',
        workingDirectory,
        package: readPackageName(workingDirectory) ?? undefined,
        changedDirectories,
        recommendedScope: 'Focus on a single workspace package instead of the whole repository.',
        confidence: 'medium',
      };
    }

    return {
      source: 'none',
      workingDirectory,
      changedDirectories: [],
      recommendedScope: NO_FOCUS_SCOPE,
      confidence: 'low',
    };
  }
}

/** Groups changed files by their parent directory, most-changed first. Root-level files are ignored. */
export function groupChangedDirectories(git: GitInfo): string[] {
  const counts = new Map<string, number>();
  for (const file of git.changedFilePaths) {
    const dir = dirname(file);
    if (dir === '.') continue;
    counts.set(dir, (counts.get(dir) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([dir]) => dir);
}

/** Walks up from `start` to find the enclosing monorepo root (manifest-based). */
export function findMonorepoRoot(start: string): string | null {
  let current = start;
  for (;;) {
    if (WORKSPACE_ROOT_MARKERS.some((marker) => existsSync(join(current, marker)))) return current;
    try {
      const raw = readFileSync(join(current, 'package.json'), 'utf8');
      const manifest = JSON.parse(raw) as { workspaces?: unknown };
      if (Array.isArray(manifest.workspaces) && manifest.workspaces.length > 0) return current;
    } catch {
      // No readable package.json at this level.
    }
    const parent = dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}

/** Reads the package name at `root`, or null when there is none or it is a workspace root. */
export function readPackageName(root: string): string | null {
  try {
    const raw = readFileSync(join(root, 'package.json'), 'utf8');
    const manifest = JSON.parse(raw) as { name?: string; workspaces?: unknown };
    if (Array.isArray(manifest.workspaces) && manifest.workspaces.length > 0) return null;
    return manifest.name ?? null;
  } catch {
    return null;
  }
}
