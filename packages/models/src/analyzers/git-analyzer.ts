import type { RecommendationInput } from '@claude-assist/types';
import type { Analyzer, ProjectAnalysis } from '../types/analysis.js';

/**
 * Reports the working-tree state. Git status is already computed by the git
 * package and carried on `RecommendationInput` — this analyzer derives analysis
 * facts from that single source of truth instead of re-running git.
 */
export class GitAnalyzer implements Analyzer {
  readonly name = 'git';

  analyze(input: RecommendationInput): Partial<ProjectAnalysis> {
    const { isRepo, changedFiles, untrackedFiles } = input.git;

    return {
      gitClean: !isRepo || (changedFiles === 0 && untrackedFiles === 0),
      changedFiles: isRepo ? changedFiles : 0,
    };
  }
}