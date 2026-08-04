import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import fg from 'fast-glob';
import type { AnalysisResult } from '@claude-assist/types';
import { buildProjectAnalysis, type MonorepoTool } from '@claude-assist/models';
import type { OptimizationAction, OptimizationPlan } from './types.js';
import { estimateTokens } from './token-estimator.js';
import { buildClaudeIgnoreContent } from './claudeignore-generator.js';

/** Dependency/cache folders that are never worth sending to Claude. */
const DEPENDENCY_FOLDER_NAMES = [
  'node_modules',
  'vendor',
  'venv',
  '.venv',
  '__pycache__',
  '.pytest_cache',
  '.mypy_cache',
  '.ruff_cache',
  '.bundle',
];

/** Generated/build output folders. */
const GENERATED_FOLDER_NAMES = [
  'dist',
  'build',
  'out',
  'coverage',
  '.next',
  '.turbo',
  '.vercel',
  '.cache',
  'target',
  'bin',
  'obj',
  '.dart_tool',
  '.gradle',
];

const NOISE_FOLDER_NAMES = [...DEPENDENCY_FOLDER_NAMES, ...GENERATED_FOLDER_NAMES];

/** Bounded traversal depth so counting a giant node_modules stays fast. */
const MAX_FOLDER_DEPTH = 6;

/** Focus the launch on changed files only when there aren't too many to pass as args. */
const MAX_CHANGED_FILES_FOR_FOCUS = 30;

interface MonorepoInfo {
  root: string | null;
  tool: MonorepoTool | null;
  packageCount: number;
}

function findMonorepoRoot(cwd: string): string | null {
  let current = cwd;
  for (;;) {
    if (
      existsSync(join(current, 'pnpm-workspace.yaml')) ||
      existsSync(join(current, 'lerna.json')) ||
      existsSync(join(current, 'turbo.json')) ||
      existsSync(join(current, 'nx.json'))
    ) {
      return current;
    }
    try {
      const raw = readFileSync(join(current, 'package.json'), 'utf8');
      const manifest = JSON.parse(raw) as { workspaces?: unknown };
      if (Array.isArray(manifest.workspaces) && manifest.workspaces.length > 0) return current;
    } catch {
      // No readable package.json here.
    }
    const parent = dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}

function detectTool(root: string): MonorepoTool | null {
  if (existsSync(join(root, 'pnpm-workspace.yaml'))) return 'pnpm';
  if (existsSync(join(root, 'lerna.json'))) return 'lerna';
  if (existsSync(join(root, 'turbo.json'))) return 'turbo';
  if (existsSync(join(root, 'nx.json'))) return 'nx';
  return 'npm';
}

function countWorkspacePackages(root: string): number {
  let count = 0;
  for (const dirName of ['packages', 'apps', 'libs', 'components']) {
    const dir = join(root, dirName);
    if (!existsSync(dir)) continue;
    try {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory() && existsSync(join(dir, entry.name, 'package.json'))) count += 1;
      }
    } catch {
      // Unreadable directory — skip.
    }
  }
  return count;
}

function readPackageName(root: string): string | null {
  try {
    const raw = readFileSync(join(root, 'package.json'), 'utf8');
    const manifest = JSON.parse(raw) as { name?: string; workspaces?: unknown };
    if (Array.isArray(manifest.workspaces) && manifest.workspaces.length > 0) return null;
    return manifest.name ?? null;
  } catch {
    return null;
  }
}

async function countFolderFiles(rootPath: string, folder: string): Promise<number> {
  const dir = join(rootPath, folder);
  if (!existsSync(dir)) return 0;
  try {
    const files = await fg('**/*', {
      cwd: dir,
      onlyFiles: true,
      dot: false,
      suppressErrors: true,
      followSymbolicLinks: false,
      deep: 6,
    });
    return files.length;
  } catch {
    return 0;
  }
}

/**
 * Turns an `AnalysisResult` into an `OptimizationPlan`: detects the folders that
 * bloat context, the language, monorepo/git state, and what actions would help —
 * plus the estimated token impact. Purely analytical — it never writes anything.
 */
export async function buildOptimizationPlan(result: AnalysisResult): Promise<OptimizationPlan> {
  const { project, git, contextEstimate } = result;
  const rootPath = project.rootPath;

  const analysis = buildProjectAnalysis({ project, stats: result.stats, git, contextEstimate });

  const presentFolders = NOISE_FOLDER_NAMES.filter((folder) => existsSync(join(rootPath, folder)));
  const folderFileCounts = new Map<string, number>();
  for (const folder of presentFolders) {
    folderFileCounts.set(folder, await countFolderFiles(rootPath, folder));
  }

  const monorepo = findMonorepoRoot(rootPath);
  const isMonorepo = monorepo !== null;
  const monorepoTool = isMonorepo ? detectTool(monorepo) : null;
  const workspacePackageCount = isMonorepo ? countWorkspacePackages(monorepo) : 0;
  // The "current package" is the one at cwd when cwd is a subpackage of the monorepo.
  const focusPackage = isMonorepo && monorepo !== rootPath ? readPackageName(rootPath) : null;

  const actions = buildActions({
    hasClaudeIgnore: analysis.hasClaudeIgnore,
    hasNodeModules: presentFolders.includes('node_modules'),
    hasBuildOutput: presentFolders.some((folder) => GENERATED_FOLDER_NAMES.includes(folder)),
    isMonorepo,
    focusPackage,
    gitAvailable: git.isRepo,
    changedFiles: git.changedFiles,
  });

  const useChangedFiles = actions.some((action) => action.id === 'use-git-changed-files');

  const tokenEstimate = estimateTokens({
    scannedSourceTokens: contextEstimate.approximateContextTokens,
    folderFileCounts,
    changedFiles: git.changedFiles,
    focusCurrentPackage: isMonorepo && focusPackage !== null,
    useChangedFiles,
  });

  return {
    rootPath,
    language: project.language,
    ignorableFolders: presentFolders,
    folderFileCounts,
    hasClaudeIgnore: analysis.hasClaudeIgnore,
    claudeIgnoreContent: buildClaudeIgnoreContent(project.language, isMonorepo),
    isMonorepo,
    monorepoTool,
    workspacePackageCount,
    focusPackage,
    gitAvailable: git.isRepo,
    gitBranch: git.branch,
    changedFiles: git.changedFiles,
    stagedFiles: git.stagedFiles,
    changedFilePaths: git.changedFilePaths,
    actions,
    tokenEstimate,
  };
}

function buildActions(input: {
  hasClaudeIgnore: boolean;
  hasNodeModules: boolean;
  hasBuildOutput: boolean;
  isMonorepo: boolean;
  focusPackage: string | null;
  gitAvailable: boolean;
  changedFiles: number;
}): OptimizationAction[] {
  const actions: OptimizationAction[] = [];

  if (input.hasNodeModules) {
    actions.push({
      id: 'ignore-node-modules',
      label: 'Ignore node_modules',
      detail: 'Dependency folders are excluded from the context.',
    });
  }

  if (input.hasBuildOutput) {
    actions.push({
      id: 'ignore-build-output',
      label: 'Ignore build output',
      detail: 'dist/, build/, coverage/ and other generated folders are excluded.',
    });
  }

  if (!input.hasClaudeIgnore) {
    actions.push({
      id: 'generate-claudeignore',
      label: 'Generate .claudeignore',
      detail: 'A language-aware ignore file is written to the project root.',
    });
  }

  if (input.isMonorepo) {
    actions.push({
      id: 'focus-current-package',
      label: input.focusPackage ? `Focus on ${input.focusPackage}` : 'Focus on a single package',
      detail: input.focusPackage
        ? 'Context is scoped to the current package instead of the whole repository.'
        : 'Run from inside a single package to scope the context.',
    });
  }

  if (input.gitAvailable && input.changedFiles > 0 && input.changedFiles <= MAX_CHANGED_FILES_FOR_FOCUS) {
    actions.push({
      id: 'use-git-changed-files',
      label: 'Use Git changed files',
      detail: 'The session is seeded with only the files you changed.',
    });
  }

  return actions;
}