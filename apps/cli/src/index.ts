#!/usr/bin/env node
import { Command } from 'commander';
import pc from 'picocolors';
import { runLaunchCommand } from './commands/launch.js';
import { runScanCommand } from './commands/scan.js';
import { runAnalyticsCommand } from './commands/analytics.js';
import { runMainMenu } from './menu/main-menu.js';

const program = new Command();

program
  .name('claude-assist')
  .description('Analyzes your project and launches Claude Code with a useful pre-flight summary.')
  .version('0.1.0')
  .option('--cwd <path>', 'Directory to analyze', process.cwd())
  .action(async (options: { cwd: string }) => {
    await runMainMenu({ cwd: options.cwd });
  });

program
  .command('launch')
  .description('Analyze the project, show a summary, then launch Claude Code')
  .option('--cwd <path>', 'Directory to analyze', process.cwd())
  .allowUnknownOption(true)
  .allowExcessArguments(true)
  .action(async (options: { cwd: string }, command: Command) => {
    // Anything after the recognized flags is forwarded straight to `claude`.
    await runLaunchCommand({ cwd: options.cwd, claudeArgs: command.args });
  });

program
  .command('scan')
  .description('Analyze the project and show a summary. Does not launch Claude Code.')
  .option('--cwd <path>', 'Directory to analyze', process.cwd())
  .action(async (options: { cwd: string }) => {
    await runScanCommand({ cwd: options.cwd });
  });

program
  .command('analytics')
  .description('Start the local usage analytics dashboard and open it in your browser.')
  .option('--port <number>', 'Port to run the dashboard on', String(4500))
  .action(async (options: { port: string }) => {
    await runAnalyticsCommand({ port: Number(options.port) });
  });

try {
  await program.parseAsync(process.argv);
} catch (error) {
  console.error(pc.red(error instanceof Error ? error.message : String(error)));
  process.exitCode = 1;
}
