import pc from 'picocolors';
import type { OptimizationPlan, TokenEstimate } from './types.js';

function section(title: string): string {
  return `${pc.bold(title)}\n${pc.dim('-'.repeat(title.length))}`;
}

export function formatTokens(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${Math.round(count / 1000)}k`;
  return String(count);
}

function renderTokenEstimate(estimate: TokenEstimate): string[] {
  return [
    section('Estimated context'),
    `Current context`,
    `  ${pc.bold(formatTokens(estimate.currentTokens))} tokens`,
    '',
    `Estimated after optimization`,
    `  ${pc.green(formatTokens(estimate.optimizedTokens))} tokens`,
    '',
    `Reduction`,
    `  ${pc.green(`${estimate.reductionPercent}%`)}`,
  ];
}

/** Renders the concise summary box shown before asking the user to confirm. */
export function renderOptimizationSummary(plan: OptimizationPlan): string {
  const lines: string[] = [];

  lines.push(section('Optimization Summary'));
  for (const action of plan.actions) {
    lines.push(`${pc.green('✓')} ${action.label}`);
  }
  if (plan.actions.length === 0) {
    lines.push(pc.dim('Nothing to optimize — the project looks lean already.'));
  }

  lines.push('', ...renderTokenEstimate(plan.tokenEstimate));

  if (plan.hasClaudeIgnore) {
    lines.push('', pc.dim(`Note: ${plan.rootPath}/.claudeignore already exists and will not be overwritten.`));
  }

  return lines.join('\n');
}

/** Renders the detailed review view (what would change and the .claudeignore preview). */
export function renderOptimizationDetails(plan: OptimizationPlan): string {
  const lines: string[] = [];

  lines.push(section('What was found'));

  lines.push(`Language: ${pc.bold(plan.language)}`);
  lines.push(`Ignorable folders: ${plan.ignorableFolders.length > 0 ? plan.ignorableFolders.join(', ') : pc.dim('none')}`);
  if (plan.isMonorepo) {
    lines.push(`Monorepo: ${pc.bold(plan.monorepoTool ?? 'workspace')} (${plan.workspacePackageCount} packages)`);
    lines.push(plan.focusPackage ? `Current package: ${pc.bold(plan.focusPackage)}` : 'Current package: none (run from a package to focus it)');
  } else {
    lines.push('Monorepo: no');
  }
  lines.push(
    plan.gitAvailable
      ? `Git: ${pc.bold(plan.gitBranch ?? 'detached')} — ${plan.changedFiles} changed, ${plan.stagedFiles} staged`
      : 'Git: not a repository',
  );

  lines.push('', section('What will be applied'));
  for (const action of plan.actions) {
    lines.push(`• ${pc.bold(action.label)}`);
    lines.push(`  ${pc.dim(action.detail)}`);
  }

  lines.push('', ...renderTokenEstimate(plan.tokenEstimate));

  if (plan.claudeIgnoreContent) {
    lines.push('', section('Proposed .claudeignore'));
    lines.push(pc.dim(plan.claudeIgnoreContent.trimEnd()));
  }

  return lines.join('\n');
}
