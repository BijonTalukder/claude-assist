import pc from 'picocolors';
import { ClaudeLauncher } from '@claude-assist/core';
import { buildFocusPrompt } from '@claude-assist/models';
import { analyzeProjectWithSpinner } from './analyze-project.js';
import { ensureClaudeAvailable } from './claude-check.js';
import { buildOptimizationPlan } from '../optimization/optimization-analyzer.js';
import { renderOptimizationDetails, renderOptimizationSummary } from '../optimization/optimization-summary-renderer.js';
import { applyOptimizations, buildLaunchContext } from '../optimization/apply-optimizations.js';
import { promptOptimizationApply } from '../ui/prompts.js';
import type { OptimizationDecision } from '../optimization/types.js';

export interface OptimizedLaunchCommandOptions {
  cwd: string;
  claudeArgs: string[];
  /** Show the detailed review before the summary when coming from the launcher's "review" option. */
  reviewFirst?: boolean;
  /** Explicit user-selected scope — highest focus priority. */
  userSelection?: string;
}

/**
 * The "Launch with recommended optimizations" workflow. Orchestrates the
 * optimization services (analyze → plan → summarize → confirm → apply → launch);
 * all logic lives in the optimization/ module, not here.
 */
export async function runOptimizedLaunchCommand(options: OptimizedLaunchCommandOptions): Promise<void> {
  if (!(await ensureClaudeAvailable())) return;

  const result = await analyzeProjectWithSpinner(options.cwd, { userSelection: options.userSelection });
  const plan = await buildOptimizationPlan(result);

  console.log('');
  console.log(options.reviewFirst ? renderOptimizationDetails(plan) : renderOptimizationSummary(plan));
  console.log('');

  let decision: OptimizationDecision = await promptOptimizationApply();
  while (decision === 'review') {
    console.log('');
    console.log(renderOptimizationDetails(plan));
    console.log('');
    decision = await promptOptimizationApply();
  }

  if (decision === 'no') {
    console.log(pc.yellow('Optimization skipped. Nothing was changed.'));
    return;
  }

  const applied = applyOptimizations(plan);
  if (applied.claudeignoreWritten) {
    console.log(pc.green(`✓ Wrote ${plan.rootPath}/.claudeignore`));
  }

  const useChangedFiles = plan.actions.some((action) => action.id === 'use-git-changed-files');
  const launch = buildLaunchContext({
    rootPath: plan.rootPath,
    claudeArgs: options.claudeArgs,
    changedFilePaths: plan.changedFilePaths,
    useChangedFiles,
    focusPackage: plan.focusPackage,
    focusPrompt: buildFocusPrompt(result.focus, result.git),
  });

  if (launch.focusMessage) console.log(pc.cyan(launch.focusMessage));
  console.log(pc.cyan('Launching Claude...'));
  console.log('');

  await new ClaudeLauncher().launch({
    args: launch.args,
    cwd: launch.cwd,
    systemPrompt: launch.systemPrompt ?? undefined,
  });
}
