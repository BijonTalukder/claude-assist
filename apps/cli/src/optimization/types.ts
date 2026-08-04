export type OptimizationActionId =
  | 'ignore-node-modules'
  | 'ignore-build-output'
  | 'generate-claudeignore'
  | 'focus-current-package'
  | 'use-git-changed-files';

export interface OptimizationAction {
  id: OptimizationActionId;
  label: string;
  detail: string;
}

export interface TokenEstimate {
  currentTokens: number;
  optimizedTokens: number;
  /** Integer percentage reduction, 0-99. */
  reductionPercent: number;
}

/** Everything the workflow knows about the project and what it plans to do. */
export interface OptimizationPlan {
  rootPath: string;
  language: string;
  /** Folders present on disk that would bloat context (node_modules, dist, target, venv, ...). */
  ignorableFolders: string[];
  /** Per-folder file counts used for the token estimate. */
  folderFileCounts: Map<string, number>;

  hasClaudeIgnore: boolean;
  /** Generated content; null when .claudeignore already exists or is not applicable. */
  claudeIgnoreContent: string | null;

  isMonorepo: boolean;
  monorepoTool: string | null;
  workspacePackageCount: number;
  /** The current package's name when cwd is a subpackage of a monorepo. */
  focusPackage: string | null;

  gitAvailable: boolean;
  gitBranch: string | null;
  changedFiles: number;
  stagedFiles: number;
  /** Relative paths of tracked changed files (used to focus the launch). */
  changedFilePaths: string[];

  actions: OptimizationAction[];
  tokenEstimate: TokenEstimate;
}

export type OptimizationDecision = 'yes' | 'review' | 'no';
