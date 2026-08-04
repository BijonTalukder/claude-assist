import type { FocusArea, GitInfo, RecommendationInput } from '@claude-assist/types';
import { FocusDetector, type FocusDetectorOptions } from './focus-detector.js';

/** Only the most-changed directories are surfaced in the prompt. */
const MAX_PRIMARY_MODIFIED_PATHS = 8;

export interface FocusPromptResult {
  focus: FocusArea;
  /** The ready-to-seed "Project Focus" block. */
  prompt: string;
}

/**
 * Builds the "Project Focus" block that is seeded into the Claude launch
 * prompt. It consumes a `FocusDetector` rather than implementing focus logic
 * itself, so detection and presentation stay independently testable.
 */
export class PromptContextBuilder {
  constructor(private readonly focusDetector: FocusDetector = new FocusDetector()) {}

  build(input: RecommendationInput, options?: FocusDetectorOptions): FocusPromptResult {
    const focus = this.focusDetector.detect(input, options);
    return { focus, prompt: buildFocusPrompt(focus, input.git) };
  }
}

export function buildFocusPrompt(focus: FocusArea, git: GitInfo): string {
  const lines: string[] = ['Project Focus', '-------------', ''];

  if (focus.workingDirectory) {
    lines.push('Working Directory', '', focus.workingDirectory, '');
  }

  if (git.isRepo && git.changedFiles > 0) {
    lines.push('Git', '', `Changed Files: ${git.changedFiles}`);
    if (git.stagedFiles > 0) lines.push(`Staged Files: ${git.stagedFiles}`);
    if (focus.changedDirectories.length > 0) {
      lines.push('', 'Primary Modified Paths', '');
      for (const dir of focus.changedDirectories.slice(0, MAX_PRIMARY_MODIFIED_PATHS)) {
        lines.push(`- ${dir}`);
      }
    }
    lines.push('');
  }

  lines.push('Recommended Scope', '', focus.recommendedScope);

  return lines.join('\n');
}
