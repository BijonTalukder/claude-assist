import type { AnalysisResult, ModelRecommender } from '@claude-assist/types';
import { ProjectScanner } from '@claude-assist/scanner';
import { GitInfoProvider } from '@claude-assist/git';
import {
  ContextEstimator,
  DefaultModelRecommender,
  FocusDetector,
  SuggestionEngine,
  type SuggestionProvider,
} from '@claude-assist/models';

export interface ClaudeAssistAnalyzerDeps {
  scanner?: ProjectScanner;
  gitInfoProvider?: GitInfoProvider;
  contextEstimator?: ContextEstimator;
  modelRecommender?: ModelRecommender;
  /** Extension point: add providers here for future suggestion sources. */
  suggestionProviders?: SuggestionProvider[];
  /** Detects the launch focus area. Defaults to the standard detector. */
  focusDetector?: FocusDetector;
}

export interface AnalyzeOptions {
  /** Explicit user-selected scope (app/package/module) — highest focus priority. */
  userSelection?: string;
}

/**
 * Top-level orchestrator. Every collaborator is injected so future versions
 * (or tests) can swap in alternative scanners/recommenders/providers without
 * touching this class.
 */
export class ClaudeAssistAnalyzer {
  private readonly scanner: ProjectScanner;
  private readonly gitInfoProvider: GitInfoProvider;
  private readonly contextEstimator: ContextEstimator;
  private readonly modelRecommender: ModelRecommender;
  private readonly suggestionEngine: SuggestionEngine;
  private readonly focusDetector: FocusDetector;

  constructor(deps: ClaudeAssistAnalyzerDeps = {}) {
    this.scanner = deps.scanner ?? new ProjectScanner();
    this.gitInfoProvider = deps.gitInfoProvider ?? new GitInfoProvider();
    this.contextEstimator = deps.contextEstimator ?? new ContextEstimator();
    this.modelRecommender = deps.modelRecommender ?? new DefaultModelRecommender();
    this.suggestionEngine = new SuggestionEngine({ providers: deps.suggestionProviders });
    this.focusDetector = deps.focusDetector ?? new FocusDetector();
  }

  async analyze(rootPath: string, options: AnalyzeOptions = {}): Promise<AnalysisResult> {
    const [{ project, stats }, git] = await Promise.all([
      this.scanner.scan(rootPath),
      this.gitInfoProvider.getInfo(rootPath),
    ]);

    const contextEstimate = this.contextEstimator.estimate(stats);
    const recommendationInput = { project, stats, git, contextEstimate };

    const modelRecommendation = this.modelRecommender.recommend(recommendationInput);
    const suggestions = this.suggestionEngine.collect(recommendationInput);
    const focus = this.focusDetector.detect(recommendationInput, { userSelection: options.userSelection });

    return { project, stats, git, contextEstimate, modelRecommendation, suggestions, focus };
  }
}
