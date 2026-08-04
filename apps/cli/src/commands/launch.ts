import pc from 'picocolors';
import { ClaudeLauncher } from '@claude-assist/core';
import { analyzeProjectWithSpinner } from './analyze-project.js';
import { renderSummary } from '../ui/render-summary.js';
import { promptConfirmLaunch } from '../ui/prompts.js';

export interface LaunchCommandOptions {
  cwd: string;
  claudeArgs: string[];
}

export async function runLaunchCommand(options: LaunchCommandOptions): Promise<void> {
  const result = await analyzeProjectWithSpinner(options.cwd);

  console.log('');
  console.log(renderSummary(result));

  const confirmed = await promptConfirmLaunch();
  if (!confirmed) {
    console.log(pc.yellow('Launch canceled.'));
    return;
  }

  console.log(pc.cyan('Launching Claude...'));
  console.log('');

  const launcher = new ClaudeLauncher();
  await launcher.launch({ args: options.claudeArgs, cwd: options.cwd });
}
