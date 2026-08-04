import { execa } from 'execa';

export interface LaunchOptions {
  args?: string[];
  cwd?: string;
}

/** Spawns the `claude` CLI, replacing the current process's stdio with it. */
export class ClaudeLauncher {
  async launch(options: LaunchOptions = {}): Promise<void> {
    const { args = [], cwd = process.cwd() } = options;

    try {
      await execa('claude', args, { cwd, stdio: 'inherit' });
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
