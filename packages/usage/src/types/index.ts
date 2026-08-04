// ---------------------------------------------------------------------------
// Normalized domain types produced by the parser.
//
// These describe what we actually found in Claude Code's local session
// files (~/.claude/projects/<project>/<session-uuid>.jsonl) — see the raw
// shapes in parser/raw-event.ts for the untyped JSON this is derived from.
// ---------------------------------------------------------------------------

export interface UsageTokens {
  input: number;
  output: number;
  cacheRead: number;
  cacheCreation: number;
}

/** One assistant turn: a single model response with its token usage. */
export interface UsageTurn {
  sessionId: string;
  projectPath: string;
  timestamp: string;
  /** Raw model id as stored by Claude Code, e.g. "claude-sonnet-5". Not yet mapped to a family/tier. */
  model: string;
  gitBranch: string | null;
  /** True for subagent (Task tool) turns, so callers can include/exclude them from aggregates. */
  isSidechain: boolean;
  tokens: UsageTokens;
}

/** A `system`/`turn_duration` event — how long one turn took to complete. */
export interface TurnDuration {
  timestamp: string;
  durationMs: number;
  messageCount: number;
}

/** Everything parsed out of a single session `.jsonl` file. */
export interface SessionRecord {
  sessionId: string;
  /** Real absolute path, read from the events themselves (never guessed from the directory name). */
  projectPath: string;
  /** The raw, encoded directory name — kept only as a fallback grouping key. */
  projectDirName: string;
  title: string | null;
  cliVersion: string | null;
  firstTimestamp: string | null;
  lastTimestamp: string | null;
  turns: UsageTurn[];
  turnDurations: TurnDuration[];
  sourceFile: string;
}

export interface ParseWarning {
  file: string;
  line: number;
  message: string;
}

export interface SessionParseResult {
  session: SessionRecord;
  warnings: ParseWarning[];
}

export interface LoadAllSessionsResult {
  sessions: SessionRecord[];
  warnings: ParseWarning[];
  claudeHomeDir: string;
  /** False when the projects directory doesn't exist or has no session files — never throws. */
  historyFound: boolean;
  totalFilesScanned: number;
  lastScanAt: string;
}

export interface ClaudeHomeOptions {
  /** Overrides `~/.claude`. Used by the future "History Location" setting. */
  claudeHomeDir?: string;
}
