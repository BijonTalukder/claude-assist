export { ContextEstimator } from './context-estimator.js';
export { DefaultModelRecommender } from './model-recommender.js';
export { DefaultSuggestionProvider, SuggestionEngine, buildProjectAnalysis } from './suggestion-engine.js';
export type { SuggestionEngineDeps } from './suggestion-engine.js';

export {
  ClaudeIgnoreAnalyzer,
  FrameworkAnalyzer,
  GitAnalyzer,
  MonorepoAnalyzer,
  PackageAnalyzer,
  ProjectAnalyzer,
} from './analyzers/index.js';

export { DefaultProvider, FrameworkProvider, LanguageProvider, LargeProjectProvider } from './providers/index.js';

export { FocusDetector, findMonorepoRoot, groupChangedDirectories, readPackageName } from './focus/focus-detector.js';
export type { FocusDetectorOptions } from './focus/focus-detector.js';
export { PromptContextBuilder, buildFocusPrompt } from './focus/prompt-context-builder.js';

export type {
  Analyzer,
  MonorepoTool,
  ProjectAnalysis,
  SuggestionContext,
  SuggestionProvider,
} from './types/analysis.js';
