// ---------------------------------------------------------------------------
// Untyped shape of one line in a Claude Code session `.jsonl` file, as
// observed on disk. Every field is optional — the format isn't documented
// and isn't guaranteed to stay this way across Claude Code versions, so the
// parser must degrade gracefully rather than assume any field exists.
//
// Known `type` values seen in the wild: "user", "assistant", "system",
// "mode", "permission-mode", "attachment", "ai-title", "last-prompt",
// "file-history-snapshot", "file-history-delta". Only "assistant", "system"
// (subtype "turn_duration"), and "ai-title" are consumed today.
// ---------------------------------------------------------------------------

export interface RawUsage {
  input_tokens?: number;
  output_tokens?: number;
  cache_read_input_tokens?: number;
  cache_creation_input_tokens?: number;
}

export interface RawMessage {
  model?: string;
  usage?: RawUsage;
}

export interface RawEvent {
  type?: string;
  subtype?: string;
  sessionId?: string;
  cwd?: string;
  timestamp?: string;
  version?: string;
  gitBranch?: string;
  isSidechain?: boolean;
  durationMs?: number;
  messageCount?: number;
  aiTitle?: string;
  message?: RawMessage;
}
