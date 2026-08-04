// ---------------------------------------------------------------------------
// Domain primitives
// ---------------------------------------------------------------------------

export type Framework = 'nestjs' | 'express' | 'nextjs' | 'react' | 'flutter' | 'unknown';

export type Language = 'typescript' | 'javascript' | 'dart' | 'unknown';

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
