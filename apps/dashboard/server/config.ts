import { homedir } from 'node:os';
import { join } from 'node:path';

export const DASHBOARD_PORT = Number(process.env.DASHBOARD_PORT ?? 4500);

/**
 * Where the dashboard keeps its own state. Deliberately not inside `~/.claude` — that
 * directory belongs to Claude Code, and this dashboard only ever reads from it.
 */
export const STATE_DIR = process.env.CLAUDE_ASSIST_STATE_DIR ?? join(homedir(), '.claude-assist');

export const HIDDEN_SESSIONS_FILE = join(STATE_DIR, 'hidden-sessions.json');
