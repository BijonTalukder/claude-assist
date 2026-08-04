import type { Suggestion } from '@claude-assist/types';
import type { SuggestionContext, SuggestionProvider } from '../types/analysis.js';

/**
 * Suggestions for large projects (as flagged by the context estimator). Unlike V1,
 * "generate a .claudeignore" and "focus on a single module" are now gated on the
 * analyzer results — no point generating a file that already exists, and "single
 * app or package" only means something in a monorepo.
 */
export class LargeProjectProvider implements SuggestionProvider {
  readonly id = 'large-project';
  readonly priority = 30;

  getSuggestions({ input, analysis }: SuggestionContext): Suggestion[] {
    if (!input.contextEstimate.isLargeProjectWarning) return [];

    const suggestions: Suggestion[] = [];

    if (!analysis.hasClaudeIgnore) {
      suggestions.push({
        id: 'generate-claudeignore',
        label: 'Generate a .claudeignore file',
        description:
          'This project is large — a .claudeignore file will help keep context focused.',
      });
    }

    if (analysis.isMonorepo) {
      suggestions.push({
        id: 'focus-single-module',
        label: 'Focus on a single app or package',
        description:
          'Analyze only the current workspace or feature instead of the entire repository.',
      });
    }

    suggestions.push({
      id: 'exclude-generated-files',
      label: 'Exclude generated folders',
      description:
        'Ignore dist/, build/, coverage/, .next/, .turbo/, and other generated output.',
    });

    return suggestions;
  }
}