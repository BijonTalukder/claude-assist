import { BellOff, ExternalLink } from 'lucide-react';
import { EmptyState } from './EmptyState';

export const CLAUDE_CODE_URL = 'https://claude.com/download/claude-code';

/** Shown instead of the dashboard content when Claude Code is not installed locally. */
export function ClaudeNotDetected() {
  return (
    <div className="flex flex-col items-center gap-5 rounded-xl border border-border bg-surface p-10 py-16">
      <EmptyState
        icon={BellOff}
        title="Claude Code not detected"
        description="This dashboard reads Claude Code's local usage history. No Claude installation was found on this machine."
      />
      <a
        href={CLAUDE_CODE_URL}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 rounded-lg bg-series-blue/15 px-3 py-1.5 text-sm font-medium text-series-blue transition-colors hover:bg-series-blue/25"
      >
        Install Claude Code
        <ExternalLink className="h-4 w-4" />
      </a>
    </div>
  );
}