#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Command } from 'commander';
import pc from 'picocolors';
import { runLaunchCommand } from './commands/launch.js';
import { runOptimizedLaunchCommand } from './commands/optimized-launch.js';
import { runScanCommand } from './commands/scan.js';
import { runAnalyticsCommand } from './commands/analytics.js';
import { runMainMenu } from './menu/main-menu.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const { version } = JSON.parse(readFileSync(resolve(__dirname, '../package.json'), 'utf-8'));

const program = new Command();

program
  .name('claude-assist')
  .description('Analyzes your project and launches Claude Code with a useful pre-flight summary.')
  .version(version)
  .option('--cwd <path>', 'Directory to analyze', process.cwd())
  .action(async (options: { cwd: string }) => {
    await runMainMenu({ cwd: options.cwd });
  });

program
  .command('launch')
  .description('Analyze the project, show a summary, then launch Claude Code')
  .option('--focus <scope>', 'Focus Claude on a specific scope (highest priority)')
  .allowUnknownOption(true)
  .allowExcessArguments(true)
  .action(async (options: { focus?: string }, command: Command) => {
    // Anything after the recognized flags is forwarded straight to `claude`.
    await runLaunchCommand({
      cwd: program.opts().cwd,
      claudeArgs: command.args,
      userSelection: options.focus,
    });
  });

program
  .command('optimized-launch')
  .description('Analyze the project and launch Claude Code with recommended context optimizations')
  .option('--focus <scope>', 'Focus Claude on a specific scope (highest priority)')
  .allowUnknownOption(true)
  .allowExcessArguments(true)
  .action(async (options: { focus?: string }, command: Command) => {
    await runOptimizedLaunchCommand({
      cwd: program.opts().cwd,
      claudeArgs: command.args,
      userSelection: options.focus,
    });
  });

program
  .command('scan')
  .description('Analyze the project and show a summary. Does not launch Claude Code.')
  .option('--focus <scope>', 'Focus Claude on a specific scope (highest priority)')
  .action(async (options: { focus?: string }) => {
    await runScanCommand({ cwd: program.opts().cwd, userSelection: options.focus });
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
