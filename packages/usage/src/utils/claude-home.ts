import { homedir } from 'node:os';
import { join } from 'node:path';
import type { ClaudeHomeOptions } from '../types/index.js';
import { ClaudeDirectoryResolver } from './claude-directory-resolver.js';

/** Resolves Claude Code's local data directory across Linux/macOS/Windows, falling back to `~/.claude` if nothing is found. */
export class ClaudeHomeLocator {
  constructor(private readonly directoryResolver: ClaudeDirectoryResolver = new ClaudeDirectoryResolver()) {}

  resolve(options: ClaudeHomeOptions = {}): string {
    if (options.claudeHomeDir) return options.claudeHomeDir;
    return this.directoryResolver.resolve().directory ?? join(homedir(), '.claude');
  }

  resolveProjectsDir(options: ClaudeHomeOptions = {}): string {
    return join(this.resolve(options), 'projects');
  }
}
