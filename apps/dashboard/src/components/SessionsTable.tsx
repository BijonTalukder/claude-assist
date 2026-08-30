import { useState } from 'react';
import type { SessionSummaryRow } from '@claude-assist/usage';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Button } from './ui/button';
import { EmptyState } from './EmptyState';
import { cn, formatCompactNumber, formatDateTime, formatUsd } from '../lib/utils';

export interface SessionsTableProps {
  sessions: SessionSummaryRow[];
  onHide?: (sessionId: string) => void;
  onUnhide?: (sessionId: string) => void;
  /** `force` overrides the server's guard against deleting a still-active session. */
  onDelete?: (sessionId: string, force: boolean) => void;
  /** Session id currently mid-request, so its row can disable its buttons. */
  pendingSessionId?: string | null;
  /** Set when the last delete was refused because the session looked active. */
  activeConflictSessionId?: string | null;
}

export function SessionsTable({
  sessions,
  onHide,
  onUnhide,
  onDelete,
  pendingSessionId,
  activeConflictSessionId,
}: SessionsTableProps) {
  // Which row is showing its "are you sure" state. Deleting a transcript is irreversible,
  // so it always takes a second, explicit click.
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  if (sessions.length === 0) {
    return <EmptyState title="No sessions yet" description="Start a Claude Code session to see it show up here." />;
  }

  const showActions = Boolean(onHide ?? onUnhide ?? onDelete);
  const sorted = [...sessions].sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Project</TableHead>
          <TableHead>Model</TableHead>
          <TableHead>Input</TableHead>
          <TableHead>Output</TableHead>
          <TableHead>Cache</TableHead>
          <TableHead>Total tokens</TableHead>
          <TableHead>Cost</TableHead>
          {showActions && <TableHead>Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((session) => {
          const isPending = pendingSessionId === session.sessionId;
          const isConfirming = confirmingId === session.sessionId;
          const forceNeeded = activeConflictSessionId === session.sessionId;

          return (
            <TableRow key={session.sessionId} className={cn(session.hidden && 'opacity-50')}>
              <TableCell className="text-ink-secondary">{formatDateTime(session.date)}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{session.projectName}</span>
                  {session.hidden && <span className="rounded bg-surface-hover px-1.5 py-0.5 text-xs text-ink-muted">Hidden</span>}
                </div>
                {session.title && <div className="max-w-xs truncate text-xs text-ink-muted">{session.title}</div>}
              </TableCell>
              <TableCell>{session.primaryModelDisplayName}</TableCell>
              <TableCell>{formatCompactNumber(session.inputTokens)}</TableCell>
              <TableCell>{formatCompactNumber(session.outputTokens)}</TableCell>
              <TableCell>{formatCompactNumber(session.cacheReadTokens + session.cacheCreationTokens)}</TableCell>
              <TableCell className="text-ink-secondary">{formatCompactNumber(session.totalTokens)}</TableCell>
              <TableCell>{formatUsd(session.totalCostUsd)}</TableCell>

              {showActions && (
                <TableCell>
                  {isConfirming ? (
                    <div className="flex flex-col gap-1.5">
                      <span className="text-xs text-ink-muted">
                        {forceNeeded
                          ? 'Active in the last minute — may still be open in Claude Code.'
                          : 'Delete the transcript permanently? It will no longer be resumable.'}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <Button
                          className="text-series-red"
                          disabled={isPending}
                          onClick={() => {
                            onDelete?.(session.sessionId, forceNeeded);
                            setConfirmingId(null);
                          }}
                        >
                          {forceNeeded ? 'Delete anyway' : 'Delete file'}
                        </Button>
                        <Button variant="ghost" disabled={isPending} onClick={() => setConfirmingId(null)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      {session.hidden
                        ? onUnhide && (
                            <Button variant="ghost" disabled={isPending} onClick={() => onUnhide(session.sessionId)}>
                              Unhide
                            </Button>
                          )
                        : onHide && (
                            <Button variant="ghost" disabled={isPending} onClick={() => onHide(session.sessionId)}>
                              Hide
                            </Button>
                          )}
                      {onDelete && (
                        <Button variant="ghost" className="text-series-red" disabled={isPending} onClick={() => setConfirmingId(session.sessionId)}>
                          Delete
                        </Button>
                      )}
                    </div>
                  )}
                </TableCell>
              )}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
