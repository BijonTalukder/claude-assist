import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { RecommendationInput } from '@claude-assist/types';
import type { Analyzer, MonorepoTool, ProjectAnalysis } from '../types/analysis.js';

const WORKSPACE_DIRS = ['packages', 'apps', 'libs', 'components'];

function detectMonorepoTool(rootPath: string): MonorepoTool | null {
  if (existsSync(join(rootPath, 'pnpm-workspace.yaml'))) return 'pnpm';
  if (existsSync(join(rootPath, 'lerna.json'))) return 'lerna';
  if (existsSync(join(rootPath, 'turbo.json'))) return 'turbo';
  if (existsSync(join(rootPath, 'nx.json'))) return 'nx';

  try {
    const raw = readFileSync(join(rootPath, 'package.json'), 'utf8');
    const manifest = JSON.parse(raw) as { workspaces?: unknown };
    if (Array.isArray(manifest.workspaces) && manifest.workspaces.length > 0) return 'npm';
  } catch {
    // No readable package.json — not a workspace manifest.
  }

  return null;
}

function countWorkspacePackages(rootPath: string): number {
  let count = 0;
  for (const dirName of WORKSPACE_DIRS) {
    const dir = join(rootPath, dirName);
    if (!existsSync(dir)) continue;
    try {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory() && existsSync(join(dir, entry.name, 'package.json'))) count += 1;
      }
    } catch {
      // Unreadable directory — ignore and keep counting the rest.
    }
  }
  return count;
}

/**
 * Detects whether the project is a monorepo (workspace-style), which tool declares
 * it (pnpm/npm workspace, turbo, nx, lerna), and roughly how many packages it
 * contains. Manifest-based so it stays reliable and fast.
 */
export class MonorepoAnalyzer implements Analyzer {
  readonly name = 'monorepo';

  analyze(input: RecommendationInput): Partial<ProjectAnalysis> {
    const rootPath = input.project.rootPath;
    const monorepoTool = detectMonorepoTool(rootPath);

    return {
      isMonorepo: monorepoTool !== null,
      monorepoTool,
      workspacePackageCount: monorepoTool !== null ? countWorkspacePackages(rootPath) : 0,
    };
  }
}