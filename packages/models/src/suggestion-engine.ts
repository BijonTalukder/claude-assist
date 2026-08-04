import type { RecommendationInput, Suggestion } from '@claude-assist/types';
import type { Analyzer, ProjectAnalysis, SuggestionContext, SuggestionProvider } from './types/analysis.js';
import {
  ClaudeIgnoreAnalyzer,
  FrameworkAnalyzer,
  GitAnalyzer,
  MonorepoAnalyzer,
  PackageAnalyzer,
  ProjectAnalyzer,
} from './analyzers/index.js';
import { DefaultProvider, FrameworkProvider, LanguageProvider, LargeProjectProvider } from './providers/index.js';

const DEFAULT_ANALYSIS: Omit<ProjectAnalysis, 'rootPath'> = {
  language: 'unknown',
  framework: 'unknown',
  packageManager: 'unknown',
  hasPackageJson: false,
  hasLockfile: false,
  hasNodeModules: false,
  hasTsConfig: false,
  hasBuildFolder: false,
  hasClaudeIgnore: false,
  claudeIgnoreIgnoresNodeModules: false,
  claudeIgnoreIgnoresGenerated: false,
  isMonorepo: false,
  monorepoTool: null,
  workspacePackageCount: 0,
  dependencyFolders: [],
  generatedFolders: [],
  gitClean: true,
  changedFiles: 0,
};

const DEFAULT_ANALYZERS: Analyzer[] = [
  new ProjectAnalyzer(),
  new GitAnalyzer(),
  new FrameworkAnalyzer(),
  new PackageAnalyzer(),
  new MonorepoAnalyzer(),
  new ClaudeIgnoreAnalyzer(),
];

const DEFAULT_PROVIDERS: SuggestionProvider[] = [
  new DefaultProvider(),
  new LanguageProvider(),
  new FrameworkProvider(),
  new LargeProjectProvider(),
];

function mergeAnalysis(base: ProjectAnalysis, partial: Partial<ProjectAnalysis>): ProjectAnalysis {
  const result = { ...base };
  for (const [key, value] of Object.entries(partial)) {
    if (value !== undefined) {
      (result as Record<string, unknown>)[key] = value;
    }
  }
  return result;
}

/** Builds a complete `ProjectAnalysis` by running every default analyzer against `input`. */
export function buildProjectAnalysis(input: RecommendationInput): ProjectAnalysis {
  return buildAnalysisFrom(input, DEFAULT_ANALYZERS);
}

export interface SuggestionEngineDeps {
  /** Inspection steps. Defaults to the standard six when omitted. */
  analyzers?: Analyzer[];
  /** Suggestion sources. Defaults to the standard four when omitted. */
  providers?: SuggestionProvider[];
}

/**
 * Pure orchestrator. Owns no inspection or recommendation logic itself — it:
 *
 *   1. runs every `Analyzer` and merges their facts into one `ProjectAnalysis`,
 *   2. builds a `SuggestionContext` and invokes every `SuggestionProvider`,
 *   3. sorts by provider priority, deduplicates by suggestion id, and returns
 *      the final list.
 *
 * Adding a new capability means adding an analyzer (facts) and/or a provider
 * (suggestions) — never editing this class.
 */
export class SuggestionEngine {
  private readonly analyzers: Analyzer[];
  private readonly providers: SuggestionProvider[];

  constructor(deps: SuggestionEngineDeps = {}) {
    this.analyzers = deps.analyzers ?? DEFAULT_ANALYZERS;
    this.providers = deps.providers ?? DEFAULT_PROVIDERS;
  }

  collect(input: RecommendationInput): Suggestion[] {
    const analysis = this.buildAnalysis(input);
    const context: SuggestionContext = { input, analysis };

    const ordered = this.providers.flatMap((provider) =>
      provider.getSuggestions(context).map((suggestion) => ({
        priority: provider.priority ?? 0,
        suggestion,
      })),
    );
    ordered.sort((a, b) => a.priority - b.priority);

    const seen = new Set<string>();
    const suggestions: Suggestion[] = [];
    for (const { suggestion } of ordered) {
      if (seen.has(suggestion.id)) continue;
      seen.add(suggestion.id);
      suggestions.push(suggestion);
    }

    return suggestions;
  }

  private buildAnalysis(input: RecommendationInput): ProjectAnalysis {
    return buildAnalysisFrom(input, this.analyzers);
  }
}

function buildAnalysisFrom(input: RecommendationInput, analyzers: Analyzer[]): ProjectAnalysis {
  const base: ProjectAnalysis = { rootPath: input.project.rootPath, ...DEFAULT_ANALYSIS };
  return analyzers.reduce((analysis, analyzer) => mergeAnalysis(analysis, analyzer.analyze(input)), base);
}

/**
 * Backward-compatible facade matching the V1 `SuggestionProvider` contract
 * (`getSuggestions(input)`). It runs the default analyzers + providers behind the
 * scenes, so code that already constructs this class keeps working unchanged.
 * New code should use `SuggestionProvider` from `./types/analysis.js` instead.
 */
export class DefaultSuggestionProvider {
  readonly id = 'default';

  getSuggestions(input: RecommendationInput): Suggestion[] {
    return new SuggestionEngine().collect(input);
  }
}