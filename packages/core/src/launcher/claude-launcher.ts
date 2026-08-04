import { execa } from 'execa';

export interface LaunchOptions {
  args?: string[];
  cwd?: string;
  /** Seeded into Claude's system prompt via --append-system-prompt. */
  systemPrompt?: string;
}

/** Spawns the `claude` CLI, replacing the current process's stdio with it. */
export class ClaudeLauncher {
  /** Returns whether the `claude` command is installed and available on PATH. */
  async isAvailable(): Promise<boolean> {
    try {
      await execa('claude', ['--version'], { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }

  async launch(options: LaunchOptions = {}): Promise<void> {
    const { args = [], cwd = process.cwd(), systemPrompt } = options;
    const claudeArgs = systemPrompt ? ['--append-system-prompt', systemPrompt, ...args] : args;

    try {
      await execa('claude', claudeArgs, { cwd, stdio: 'inherit' });
    } catch (error) {
      if (this.isCommandNotFound(error)) {
        throw new Error(
          'Could not find the "claude" command. Make sure Claude Code is installed and available on your PATH.',
        );
      }
      throw error;
    }
  }

  private isCommandNotFound(error: unknown): boolean {
    return error instanceof Error && 'code' in error && (error as { code?: string }).code === 'ENOENT';
  }
}
