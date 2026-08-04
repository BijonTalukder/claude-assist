import type { ContextEstimate, ProjectSize, ProjectStats } from '@claude-assist/types';

// Rough heuristic, not an exact tokenizer: ~32 chars/line of source, ~4 chars/token.
const CHARS_PER_LINE_ESTIMATE = 32;
const CHARS_PER_TOKEN_ESTIMATE = 4;

const SIZE_THRESHOLDS_LOC = {
  small: 2_000,
  medium: 20_000,
  large: 100_000,
} as const;

export class ContextEstimator {
  estimate(stats: ProjectStats): ContextEstimate {
    const approximateContextTokens = Math.round(
      (stats.sourceLinesOfCode * CHARS_PER_LINE_ESTIMATE) / CHARS_PER_TOKEN_ESTIMATE,
    );
    const projectSize = this.classifySize(stats.sourceLinesOfCode);
    const isLargeProjectWarning = projectSize === 'large' || projectSize === 'very-large';

    return { projectSize, approximateContextTokens, isLargeProjectWarning };
  }

  private classifySize(linesOfCode: number): ProjectSize {
    if (linesOfCode < SIZE_THRESHOLDS_LOC.small) return 'small';
    if (linesOfCode < SIZE_THRESHOLDS_LOC.medium) return 'medium';
    if (linesOfCode < SIZE_THRESHOLDS_LOC.large) return 'large';
    return 'very-large';
  }
}
