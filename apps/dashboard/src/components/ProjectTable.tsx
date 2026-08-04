import { useMemo, useState } from 'react';
import type { ProjectUsageBreakdown } from '@claude-assist/usage';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { EmptyState } from './EmptyState';
import { formatCompactNumber, formatDateTime, formatPercent, formatUsd } from '../lib/utils';

export interface ProjectTableProps {
  projects: ProjectUsageBreakdown[];
}

type SortKey = 'totalTokens' | 'totalCostUsd';

export function ProjectTable({ projects }: ProjectTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('totalTokens');

  const sorted = useMemo(() => [...projects].sort((a, b) => b[sortKey] - a[sortKey]), [projects, sortKey]);
  const topProjectPath = sorted[0]?.projectPath;

  if (projects.length === 0) {
    return <EmptyState title="No projects yet" description="Once you use Claude Code in a project, it'll show up here." />;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="text-xs text-ink-muted">Sort by</span>
        <Button variant={sortKey === 'totalTokens' ? 'active' : 'default'} onClick={() => setSortKey('totalTokens')}>
          Tokens
        </Button>
        <Button variant={sortKey === 'totalCostUsd' ? 'active' : 'default'} onClick={() => setSortKey('totalCostUsd')}>
          Cost
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Project</TableHead>
            <TableHead>Sessions</TableHead>
            <TableHead>Tokens</TableHead>
            <TableHead>Cost</TableHead>
            <TableHead>Last activity</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((project) => (
            <TableRow key={project.projectPath}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{project.projectName}</span>
                  {project.projectPath === topProjectPath && <Badge variant="warning">Highest usage</Badge>}
                </div>
                <div className="text-xs text-ink-muted">{project.projectPath}</div>
              </TableCell>
              <TableCell>{project.sessionCount}</TableCell>
              <TableCell>
                {formatCompactNumber(project.totalTokens)}{' '}
                <span className="text-xs text-ink-muted">({formatPercent(project.shareOfTotalTokens)})</span>
              </TableCell>
              <TableCell>{formatUsd(project.totalCostUsd)}</TableCell>
              <TableCell className="text-ink-secondary">{project.lastActivity ? formatDateTime(project.lastActivity) : '—'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
