import type {
  ModelRecommendation,
  ModelRecommender as IModelRecommender,
  RecommendationInput,
} from '@claude-assist/types';

const COMPLEX_FRAMEWORKS = new Set(['nestjs', 'nextjs']);
const MANY_CHANGED_FILES_THRESHOLD = 20;
const SMALL_PROJECT_FILE_THRESHOLD = 100;

/**
 * Rule-based recommendation for V1. No AI calls — purely heuristics over the
 * scan/git/context results. Swappable via ModelRecommender for future
 * versions that might call out to a real classifier.
 */
export class DefaultModelRecommender implements IModelRecommender {
  recommend(input: RecommendationInput): ModelRecommendation {
    const { project, stats, git, contextEstimate } = input;

    if (contextEstimate.isLargeProjectWarning) {
      return {
        model: 'opus',
        reason: 'Large codebase with significant context — Opus handles deep, multi-file reasoning best.',
      };
    }

    const isComplexProject =
      COMPLEX_FRAMEWORKS.has(project.framework) || git.changedFiles > MANY_CHANGED_FILES_THRESHOLD;
    if (isComplexProject) {
      return {
        model: 'sonnet',
        reason: 'Best balance between cost and reasoning for a moderately complex project.',
      };
    }

    const isSmallProject = contextEstimate.projectSize === 'small' && stats.totalFiles < SMALL_PROJECT_FILE_THRESHOLD;
    if (isSmallProject) {
      return {
        model: 'haiku',
        reason: 'Small, simple project — fast and cost-effective for lightweight tasks.',
      };
    }

    return {
      model: 'sonnet',
      reason: 'Best balance between cost and reasoning for general-purpose development.',
    };
  }
}
