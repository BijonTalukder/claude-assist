import type { Suggestion } from '@claude-assist/types';
import type { SuggestionContext, SuggestionProvider } from '../types/analysis.js';

/**
 * Framework-specific suggestions, each gated on the analyzer actually finding the
 * framework's telltale generated folder. Empty when the framework is unknown or
 * nothing specific applies — it never guesses.
 */
export class FrameworkProvider implements SuggestionProvider {
  readonly id = 'framework';
  readonly priority = 20;

  getSuggestions({ analysis }: SuggestionContext): Suggestion[] {
    const { framework, generatedFolders } = analysis;
    const suggestions: Suggestion[] = [];

    if (framework === 'nextjs' && generatedFolders.includes('.next')) {
      suggestions.push({
        id: 'ignore-next-cache',
        label: 'Ignore the .next build cache',
        description:
          'The .next folder is generated build output — exclude it to keep context focused.',
      });
    }

    if (framework === 'flutter' && generatedFolders.includes('.dart_tool')) {
      suggestions.push({
        id: 'ignore-dart-tool',
        label: 'Ignore Flutter\'s .dart_tool',
        description:
          '.dart_tool is generated tooling state that adds noise without useful context.',
      });
    }

    return suggestions;
  }
}