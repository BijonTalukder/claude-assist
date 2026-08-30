import { realpath, stat, unlink } from 'node:fs/promises';
import { sep } from 'node:path';

export type SessionDeleteFailure =
  | 'not-found'
  | 'outside-claude-directory'
  | 'session-active'
  | 'file-in-use';

export class SessionDeleteError extends Error {
  constructor(
    readonly reason: SessionDeleteFailure,
    message: string,
  ) {
    super(message);
    this.name = 'SessionDeleteError';
  }
}

/**
 * A transcript touched within this window is assumed to still be open in Claude Code.
 * Deleting a live session's file is unpredictable — Claude Code holds the descriptor and
 * keeps appending to the now-unlinked inode, so the session breaks in place rather than
 * disappearing cleanly.
 */
export const ACTIVE_SESSION_WINDOW_MS = 60_000;

function isInside(child: string, parent: string): boolean {
  const parentWithSep = parent.endsWith(sep) ? parent : `${parent}${sep}`;
  return child.startsWith(parentWithSep);
}

export interface DeleteSessionFileOptions {
  /** Skips the active-session guard. Everything else still applies. */
  force?: boolean;
  now?: number;
}

/**
 * Permanently removes one session transcript from disk.
 *
 * `sourceFile` must come from a session the repository actually parsed — never from the
 * client — and is re-checked here anyway: both paths are resolved through `realpath` so a
 * symlink cannot point the deletion outside Claude Code's projects directory.
 */
export async function deleteSessionFile(
  sourceFile: string,
  claudeProjectsDir: string,
  options: DeleteSessionFileOptions = {},
): Promise<void> {
  const now = options.now ?? Date.now();

  let resolvedFile: string;
  let resolvedRoot: string;
  try {
    resolvedFile = await realpath(sourceFile);
  } catch {
    throw new SessionDeleteError('not-found', 'Session transcript no longer exists on disk.');
  }

  try {
    resolvedRoot = await realpath(claudeProjectsDir);
  } catch {
    throw new SessionDeleteError('outside-claude-directory', "Claude Code's projects directory could not be resolved.");
  }

  if (!isInside(resolvedFile, resolvedRoot)) {
    throw new SessionDeleteError(
      'outside-claude-directory',
      'Refusing to delete a file outside Claude Code\'s projects directory.',
    );
  }

  if (!options.force) {
    const { mtimeMs } = await stat(resolvedFile);
    if (now - mtimeMs < ACTIVE_SESSION_WINDOW_MS) {
      throw new SessionDeleteError(
        'session-active',
        'This session was active in the last minute and may still be open in Claude Code.',
      );
    }
  }

  try {
    await unlink(resolvedFile);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === 'ENOENT') {
      throw new SessionDeleteError('not-found', 'Session transcript no longer exists on disk.');
    }
    // Windows refuses to unlink an open file rather than deferring like POSIX does.
    if (code === 'EBUSY' || code === 'EPERM' || code === 'EACCES') {
      throw new SessionDeleteError('file-in-use', 'The transcript file is locked by another process.');
    }
    throw error;
  }
}
