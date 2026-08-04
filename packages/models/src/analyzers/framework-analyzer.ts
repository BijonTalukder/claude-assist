import type { RecommendationInput } from '@claude-assist/types';
import type { Analyzer, ProjectAnalysis } from '../types/analysis.js';

/**
 * Reports the detected framework. Framework detection already runs in the
 * scanner and is carried on `RecommendationInput`, so this derives the fact from
 * that source rather than re-detecting (which would risk disagreeing with the
 * scanner). Framework-specific *recommendations* live in providers, not here.
 */
export class FrameworkAnalyzer implements Analyzer {
  readonly name = 'framework';

  analyze(input: RecommendationInput): Partial<ProjectAnalysis> {
    return { framework: input.project.framework };
  }
}