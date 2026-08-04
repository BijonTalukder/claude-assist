import { HardDrive } from 'lucide-react';

/**
 * Honest-data label: this dashboard reads Claude Code's *local* session history on this
 * machine. The same account can be used on several devices, so it must never look like a
 * full, account-wide usage report.
 */
export function DataSourceNotice() {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-xs text-ink-muted">
      <HardDrive className="h-3.5 w-3.5 flex-shrink-0 text-ink-muted" />
      <span>
        Showing Claude Code usage recorded on <span className="font-medium text-ink-secondary">this device only</span>.
        If you use the same account on other devices, their usage is not included here.
      </span>
    </div>
  );
}
