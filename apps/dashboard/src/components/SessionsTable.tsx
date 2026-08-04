import type { SessionSummaryRow } from '@claude-assist/usage';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { EmptyState } from './EmptyState';
import { formatCompactNumber, formatDateTime, formatUsd } from '../lib/utils';

export interface SessionsTableProps {
  sessions: SessionSummaryRow[];
}

export function SessionsTable({ sessions }: SessionsTableProps) {
  if (sessions.length === 0) {
    return <EmptyState title="No sessions yet" description="Start a Claude Code session to see it show up here." />;
  }

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
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((session) => (
          <TableRow key={session.sessionId}>
            <TableCell className="text-ink-secondary">{formatDateTime(session.date)}</TableCell>
            <TableCell>
              <div className="font-medium">{session.projectName}</div>
              {session.title && <div className="max-w-xs truncate text-xs text-ink-muted">{session.title}</div>}
            </TableCell>
            <TableCell>{session.primaryModelDisplayName}</TableCell>
            <TableCell>{formatCompactNumber(session.inputTokens)}</TableCell>
            <TableCell>{formatCompactNumber(session.outputTokens)}</TableCell>
            <TableCell>{formatCompactNumber(session.cacheReadTokens + session.cacheCreationTokens)}</TableCell>
            <TableCell className="text-ink-secondary">{formatCompactNumber(session.totalTokens)}</TableCell>
            <TableCell>{formatUsd(session.totalCostUsd)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
