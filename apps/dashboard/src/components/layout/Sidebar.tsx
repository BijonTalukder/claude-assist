import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Cpu, FolderKanban, History, LayoutDashboard, Rocket, Activity } from 'lucide-react';
import { cn } from '../../lib/utils';
import { analyticsApi, type StatusResponse } from '../../services/analytics-api';

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Overview', icon: LayoutDashboard },
  { to: '/usage', label: 'Usage', icon: Activity },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/models', label: 'Models', icon: Cpu },
  { to: '/sessions', label: 'Sessions', icon: History },
];

function StatusFooter() {
  // Installation status barely changes during a session — fetch once rather than poll.
  const [status, setStatus] = useState<StatusResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    analyticsApi
      .getStatus()
      .then((result) => {
        if (!cancelled) setStatus(result);
      })
      .catch(() => {
        if (!cancelled) setStatus(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!status) {
    return <div className="px-4 py-4 text-xs text-ink-muted">Local-only · no cloud sync</div>;
  }

  return (
    <div className="flex flex-col gap-1 px-4 py-4 text-xs text-ink-muted">
      <div className="flex items-center gap-1.5">
        <span className={cn('h-1.5 w-1.5 rounded-full', status.installed ? 'bg-status-good' : 'bg-status-warning')} />
        {status.installed ? 'Claude Code found' : 'Claude Code not found'}
      </div>
      {status.installed && status.directory && <div className="truncate" title={status.directory}>{status.directory}</div>}
      <div>Local-only · no cloud sync</div>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="flex h-full w-56 flex-col border-r border-border bg-surface">
      <div className="flex items-center gap-2 px-4 py-5">
        <Rocket className="h-5 w-5 text-series-orange" />
        <span className="text-sm font-semibold text-ink-primary">Claude Assist</span>
      </div>

      <nav className="flex flex-col gap-0.5 px-2">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-ink-secondary transition-colors hover:bg-surface-hover hover:text-ink-primary',
                isActive && 'bg-series-blue/15 text-series-blue hover:bg-series-blue/15 hover:text-series-blue',
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto">
        <StatusFooter />
      </div>
    </aside>
  );
}
