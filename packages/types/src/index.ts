// ---------------------------------------------------------------------------
// Domain primitives
// ---------------------------------------------------------------------------

export type Framework = 'nestjs' | 'express' | 'nextjs' | 'react' | 'flutter' | 'unknown';

export type Language =
  | 'typescript'
  | 'javascript'
  | 'dart'
  | 'python'
  | 'java'
  | 'csharp'
  | 'go'
  | 'ruby'
  | 'php'
  | 'rust'
  | 'unknown';

export type PackageManager = 'pnpm' | 'yarn' | 'npm' | 'bun' | 'unknown';

export type ClaudeModel = 'haiku' | 'sonnet' | 'opus';

export type ProjectSize = 'small' | 'medium' | 'large' | 'very-large';

// ---------------------------------------------------------------------------
// Scan results
// ---------------------------------------------------------------------------

export interface ProjectInfo {
  name: string;
  rootPath: string;
  framework: Framework;
  language: Language;
  packageManager: PackageManager;
}

export interface FolderSize {
  path: string;
  fileCount: number;
}

export interface ProjectStats {
  totalFiles: number;
  sourceLinesOfCode: number;
  largestFolders: FolderSize[];
}

export interface GitInfo {
  isRepo: boolean;
  branch: string | null;
  changedFiles: number;
  untrackedFiles: number;
  /** Number of files staged for commit. */
  stagedFiles: number;
  /** Relative paths of tracked files with uncommitted changes (staged or working-tree). */
  changedFilePaths: string[];
}

export interface ContextEstimate {
  projectSize: ProjectSize;
  approximateContextTokens: number;
  isLargeProjectWarning: boolean;
}

export interface ModelRecommendation {
  model: ClaudeModel;
  reason: string;
}

export interface Suggestion {
  id: string;
  label: string;
  description?: string;
}

export interface AnalysisResult {
  project: ProjectInfo;
  stats: ProjectStats;
  git: GitInfo;
  contextEstimate: ContextEstimate;
  modelRecommendation: ModelRecommendation;
  suggestions: Suggestion[];
  /** Where Claude's attention should be directed when it launches. */
  focus: FocusArea;
}

// ---------------------------------------------------------------------------
// Focus detection
// ---------------------------------------------------------------------------

export type FocusSource = 'user' | 'cwd' | 'git' | 'workspace' | 'none';

export type FocusConfidence = 'high' | 'medium' | 'low';

/**
 * Where Claude's attention should be directed when it launches. Derived from
 * factual project metadata only (working directory, git changes, workspace
 * layout) — names are never guessed from conventions.
 */
export interface FocusArea {
  /** Which evidence produced the `recommendedScope`. */
  source: FocusSource;
  /** The working directory Claude runs in. */
  workingDirectory?: string;
  /** Current workspace/package name when cwd sits inside a monorepo package. */
  package?: string;
  /** Directories with uncommitted changes, most-changed first (relative paths). */
  changedDirectories: string[];
  /** Human-readable sentence telling Claude what to focus on. */
  recommendedScope: string;
  confidence: FocusConfidence;
}

// ---------------------------------------------------------------------------
// Extension points
//
// V1 ships one implementation of each interface below. Future versions
// (security scanning, performance scanning, usage dashboards, ...) can plug
// in additional implementations without modifying existing packages.
// ---------------------------------------------------------------------------

export interface ScanContext {
  rootPath: string;
}

/** A pluggable analysis step that produces some typed result from a project. */
export interface Scanner<T> {
  readonly name: string;
  scan(context: ScanContext): Promise<T>;
}

export interface RecommendationInput {
  project: ProjectInfo;
  stats: ProjectStats;
  git: GitInfo;
  contextEstimate: ContextEstimate;
}

/** Chooses which Claude model to recommend for the current project. */
export interface ModelRecommender {
  recommend(input: RecommendationInput): ModelRecommendation;
}

/** Contributes zero or more suggestions based on the current analysis. */
export interface SuggestionProvider {
  readonly id: string;
  getSuggestions(input: RecommendationInput): Suggestion[];
}
