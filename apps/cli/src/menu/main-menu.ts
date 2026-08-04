import pc from 'picocolors';
import { promptSelect } from '../ui/prompts.js';
import { runLaunchCommand } from '../commands/launch.js';
import { runScanCommand } from '../commands/scan.js';
import { runAnalyticsCommand } from '../commands/analytics.js';

export type MainMenuAction = 'launch' | 'analytics' | 'scan' | 'exit';

const MAIN_MENU_CHOICES: Array<{ name: string; value: MainMenuAction }> = [
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

  const action = await promptSelect<MainMenuAction>('What do you want to do?', MAIN_MENU_CHOICES);

  switch (action) {
    case 'launch':
      await runLaunchCommand({ cwd: options.cwd, claudeArgs: [] });
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
