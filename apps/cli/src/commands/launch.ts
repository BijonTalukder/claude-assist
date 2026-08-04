import pc from 'picocolors';
import { ClaudeLauncher } from '@claude-assist/core';
import { buildFocusPrompt } from '@claude-assist/models';
import { analyzeProjectWithSpinner } from './analyze-project.js';
import { ensureClaudeAvailable } from './claude-check.js';
import { renderSummary } from '../ui/render-summary.js';
import { promptLauncherOptions } from '../ui/prompts.js';
import { runOptimizedLaunchCommand } from './optimized-launch.js';

export interface LaunchCommandOptions {
  cwd: string;
  claudeArgs: string[];
  /** Explicit user-selected scope — highest focus priority. */
  userSelection?: string;
}

/**
 * The plain launch flow: analyze, render the summary, show the launcher menu,
 * then delegate to the chosen action (optimized launch / review / normal launch).
 * No optimization logic lives here — that's all in optimized-launch.ts.
 */
export async function runLaunchCommand(options: LaunchCommandOptions): Promise<void> {
  if (!(await ensureClaudeAvailable())) return;

  const result = await analyzeProjectWithSpinner(options.cwd, { userSelection: options.userSelection });

  console.log('');
  console.log(renderSummary(result));

  const choice = await promptLauncherOptions();

  switch (choice) {
    case 'optimized':
      await runOptimizedLaunchCommand({
        cwd: options.cwd,
        claudeArgs: options.claudeArgs,
        userSelection: options.userSelection,
      });
      return;
    case 'review':
      await runOptimizedLaunchCommand({
        cwd: options.cwd,
        claudeArgs: options.claudeArgs,
        reviewFirst: true,
        userSelection: options.userSelection,
      });
      return;
    case 'normal':
      console.log(pc.cyan('Launching Claude...'));
      console.log('');
      await new ClaudeLauncher().launch({
        args: options.claudeArgs,
        cwd: options.cwd,
        systemPrompt: buildFocusPrompt(result.focus, result.git),
      });
      return;
    case 'cancel':
      console.log(pc.yellow('Launch canceled.'));
      return;
  }
}
