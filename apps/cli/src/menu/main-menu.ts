import pc from 'picocolors';
import { promptSelect } from '../ui/prompts.js';
import { runLaunchCommand } from '../commands/launch.js';
import { runOptimizedLaunchCommand } from '../commands/optimized-launch.js';
import { isClaudeAvailable, CLAUDE_CODE_URL } from '../commands/claude-check.js';
import { runScanCommand } from '../commands/scan.js';
import { runAnalyticsCommand } from '../commands/analytics.js';

export type MainMenuAction = 'launch' | 'optimized-launch' | 'analytics' | 'scan' | 'exit';

const MAIN_MENU_CHOICES: Array<{ name: string; value: MainMenuAction }> = [
  { name: '🚀 Launch with recommended optimizations', value: 'optimized-launch' },
  { name: '🤖 Launch Claude Code', value: 'launch' },
  { name: '📊 Usage Analytics', value: 'analytics' },
  { name: '🔍 Project Scan', value: 'scan' },
  { name: '🚪 Exit', value: 'exit' },
];

export interface MainMenuOptions {
  cwd: string;
}

export async function runMainMenu(options: MainMenuOptions): Promise<void> {
  console.log(pc.bold(pc.cyan('🚀 Claude Assist')));
  console.log('');

  if (!(await isClaudeAvailable())) {
    console.log(pc.yellow(`⚠ Claude Code not detected on this machine.`));
    console.log(pc.dim(`  To use Claude, install it from: ${CLAUDE_CODE_URL}`));
    console.log('');
  }

  const action = await promptSelect<MainMenuAction>('What do you want to do?', MAIN_MENU_CHOICES);

  switch (action) {
    case 'launch':
      await runLaunchCommand({ cwd: options.cwd, claudeArgs: [] });
      return;
    case 'optimized-launch':
      await runOptimizedLaunchCommand({ cwd: options.cwd, claudeArgs: [] });
      return;
    case 'analytics':
      await runAnalyticsCommand();
      return;
    case 'scan':
      await runScanCommand({ cwd: options.cwd });
      return;
    case 'exit':
      console.log(pc.dim('Goodbye!'));
      return;
  }
}
