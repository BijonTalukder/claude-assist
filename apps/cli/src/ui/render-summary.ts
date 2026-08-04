import pc from 'picocolors';
import type { AnalysisResult } from '@claude-assist/types';
import { formatFrameworkLabel, formatLanguageLabel, formatLinesOfCode, formatModelLabel } from './format-utils.js';

function section(title: string): string {
  return `${pc.bold(title)}\n${pc.dim('-'.repeat(title.length))}`;
}

export function renderSummary(result: AnalysisResult): string {
  const { project, git, stats, contextEstimate, modelRecommendation, suggestions } = result;
  const lines: string[] = [];

  lines.push(pc.bold(pc.cyan('🚀 Claude Assist')), '');

  lines.push(section('Project'));
  lines.push(`Name: ${project.name}`);
  lines.push(`Framework: ${formatFrameworkLabel(project.framework)}`);
  lines.push(`Language: ${formatLanguageLabel(project.language)}`);
  lines.push('');

  lines.push(section('Git'));
  if (git.isRepo) {
    lines.push(`Branch: ${git.branch ?? pc.dim('(detached)')}`);
    lines.push(`Changed Files: ${git.changedFiles}`);
    lines.push(`Untracked Files: ${git.untrackedFiles}`);
  } else {
    lines.push(pc.dim('Not a git repository'));
  }
  lines.push('');

  lines.push(section('Stats'));
  lines.push(`Files: ${stats.totalFiles}`);
  lines.push(`LOC: ${formatLinesOfCode(stats.sourceLinesOfCode)}`);
  if (stats.largestFolders.length > 0) {
    const top = stats.largestFolders
      .slice(0, 3)
      .map((folder) => `${folder.path} (${folder.fileCount})`)
      .join(', ');
    lines.push(`Largest Folders: ${top}`);
  }
  lines.push('');

  lines.push(section('AI Recommendation'));
  lines.push(`Model: ${pc.green(formatModelLabel(modelRecommendation.model))}`);
  lines.push('');
  lines.push('Reason:');
  lines.push(modelRecommendation.reason);
  lines.push('');

  if (contextEstimate.isLargeProjectWarning) {
    lines.push(
      pc.yellow(
        `⚠ Large project detected (~${contextEstimate.approximateContextTokens.toLocaleString()} tokens of context)`,
      ),
    );
    lines.push('');
  }

  lines.push(section('Suggestions'));
  if (suggestions.length === 0) {
    lines.push(pc.dim('No suggestions — this project looks clean.'));
  } else {
    for (const suggestion of suggestions) {
      lines.push(`${pc.green('✓')} ${suggestion.label}`);
    }
  }
  lines.push('');

  return lines.join('\n');
}
