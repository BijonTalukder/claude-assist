import type { RecommendationInput, Suggestion, SuggestionProvider } from '@claude-assist/types';

const BUILD_OUTPUT_FOLDER_NAMES = new Set(['dist', 'build', 'out', '.next']);

/** The suggestions shipped in V1. Additional providers can be added without changing this one. */
export class DefaultSuggestionProvider implements SuggestionProvider {
  readonly id = 'default';

  getSuggestions(input: RecommendationInput): Suggestion[] {
    const { git, project, stats, contextEstimate } = input;
    const suggestions: Suggestion[] = [];

    if (git.isRepo && git.changedFiles > 0) {
      suggestions.push({
        id: 'review-changed-files',
        label: 'Review changed files',
        description: `Focus the session on the ${git.changedFiles} changed file(s) instead of the whole project.`,
      });
    }

    if (project.packageManager !== 'unknown') {
      suggestions.push({
        id: 'ignore-node-modules',
        label: 'Ignore node_modules',
        description: 'Exclude dependency folders from context to keep it focused on your code.',
      });
    }

    const hasBuildOutput = stats.largestFolders.some((folder) => BUILD_OUTPUT_FOLDER_NAMES.has(folder.path));
    if (hasBuildOutput) {
      suggestions.push({
        id: 'ignore-build-output',
        label: 'Ignore dist/build output',
        description: 'Compiled output adds noise without adding useful context.',
      });
    }

    if (contextEstimate.isLargeProjectWarning) {
      suggestions.push({
        id: 'generate-claudeignore',
        label: 'Generate a .claudeignore file',
        description: 'This project is large — a .claudeignore file will help keep context focused.',
      });
    }

    return suggestions;
  }
}

/** Aggregates suggestions from any number of providers — the extension point for future versions. */
export class SuggestionEngine {
  constructor(private readonly providers: SuggestionProvider[]) {}

  collect(input: RecommendationInput): Suggestion[] {
    return this.providers.flatMap((provider) => provider.getSuggestions(input));
  }
}
