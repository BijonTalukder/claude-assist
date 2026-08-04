import type { RecommendationInput, Suggestion } from '@claude-assist/types';

/** How a monorepo is declared on disk. */
export type MonorepoTool = 'pnpm' | 'npm' | 'turbo' | 'nx' | 'lerna';

/**
 * Structured facts about a project. Produced by `Analyzer`s, consumed by
 * `SuggestionProvider`s. Providers never inspect the filesystem themselves —
 * they read only this object (plus the `RecommendationInput` that was already
 * computed by the scanner/git/context pipeline).
 */
export interface ProjectAnalysis {
  rootPath: string;
  language: string;
  framework: string;
  packageManager: string;
  hasPackageJson: boolean;
  hasLockfile: boolean;
  hasNodeModules: boolean;
  hasTsConfig: boolean;
  hasBuildFolder: boolean;
  hasClaudeIgnore: boolean;
  /** True when the existing `.claudeignore` already excludes `node_modules`. */
  claudeIgnoreIgnoresNodeModules: boolean;
  /** True when the existing `.claudeignore` already excludes generated output. */
  claudeIgnoreIgnoresGenerated: boolean;
  isMonorepo: boolean;
  /** How the monorepo is declared (pnpm/npm workspace, turbo, nx, lerna) — null when not a monorepo. */
  monorepoTool: MonorepoTool | null;
  workspacePackageCount: number;
  /** Dependency/cache folders present at the root (node_modules, vendor, venv, ...). */
  dependencyFolders: string[];
  /** Generated/build output folders present at the root (dist, build, .next, ...). */
  generatedFolders: string[];
  /** False when the repo has uncommitted changes or untracked files. */
  gitClean: boolean;
  changedFiles: number;
}

/** Everything a `SuggestionProvider` needs to decide what to recommend. */
export interface SuggestionContext {
  input: RecommendationInput;
  analysis: ProjectAnalysis;
}

/**
 * Contributes zero or more suggestions based on the merged analysis. This is the
 * models-local provider contract (analysis-aware); it supersedes the
 * `RecommendationInput`-only `SuggestionProvider` in `@claude-assist/types`, which
 * is kept as the stable external extension contract.
 */
export interface SuggestionProvider {
  readonly id: string;
  /** Lower runs first — the engine sorts suggestions by (priority, id). */
  readonly priority?: number;
  getSuggestions(context: SuggestionContext): Suggestion[];
}

/**
 * A pluggable inspection step. Analyzers ONLY inspect the project (filesystem or
 * already-computed inputs) and return structured facts. They never create
 * user-facing suggestions — that is exclusively a provider's job.
 *
 * Synchronous on purpose: each check is a cheap stat/read, which keeps
 * `SuggestionEngine.collect` synchronous (matching its V1 signature).
 */
export interface Analyzer {
  readonly name: string;
  analyze(input: RecommendationInput): Partial<ProjectAnalysis>;
}
