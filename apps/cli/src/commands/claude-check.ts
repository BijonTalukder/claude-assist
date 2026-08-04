import pc from 'picocolors';
import { ClaudeLauncher } from '@claude-assist/core';

export const CLAUDE_CODE_URL = 'https://claude.com/download/claude-code';

export async function isClaudeAvailable(): Promise<boolean> {
  return new ClaudeLauncher().isAvailable();
}

/** Prints the "not detected" notice + install link and returns whether to abort. */
export async function ensureClaudeAvailable(): Promise<boolean> {
  if (await isClaudeAvailable()) return true;

  console.log('');
  console.log(pc.yellow('⚠ Claude Code not detected.'));
  console.log('');
  console.log('Install Claude Code, then run this command again:');
  console.log(pc.cyan(CLAUDE_CODE_URL));
  console.log('');
  return false;
}
