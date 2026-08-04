import type { Suggestion } from '@claude-assist/types';
import type { SuggestionContext, SuggestionProvider } from '../types/analysis.js';

/**
 * The general, language/framework-agnostic suggestions: review dirty working
 * tree, ignore dependency folders, ignore generated output. Priority 0 so these
 * generic hints sort ahead of the more specific providers.
 */
export class DefaultProvider implements SuggestionProvider {
  readonly id = 'default';
  readonly priority = 0;

  getSuggestions({ analysis }: SuggestionContext): Suggestion[] {
    const suggestions: Suggestion[] = [];

    if (!analysis.gitClean && analysis.changedFiles > 0) {
      suggestions.push({
        id: 'review-changed-files',
        label: 'Review changed files',
        description: `Focus the session on the ${analysis.changedFiles} changed file(s) instead of the whole project.`,
      });
    }

    if (analysis.hasNodeModules) {
      suggestions.push({
        id: 'ignore-node-modules',
        label: 'Ignore node_modules',
        description:
          'Exclude dependency folders from context to keep it focused on your code.',
      });
    }

    if (analysis.hasBuildFolder) {
      suggestions.push({
        id: 'ignore-build-output',
        label: 'Ignore dist/build output',
        description:
          'Compiled output adds noise without adding useful context.',
      });
    }

    return suggestions;
  }
}