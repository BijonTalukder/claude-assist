import { useCallback } from 'react';
import { Coins, Cpu, DollarSign, FolderKanban, Gauge, History, TrendingDown, TrendingUp } from 'lucide-react';
import { AppLayout } from '../components/layout/AppLayout';
import { StatCard } from '../components/StatCard';
import { InsightsList } from '../components/InsightsList';
import { LastUpdated } from '../components/LastUpdated';
import { ErrorBanner } from '../components/ErrorBanner';
import { MockDataBanner } from '../components/MockDataBanner';
import { Skeleton } from '../components/ui/skeleton';
import { useUsageAnalytics } from '../hooks/useUsageAnalytics';
import { analyticsApi } from '../services/analytics-api';
import { formatCompactNumber, formatUsd } from '../lib/utils';

export function Dashboard() {
  const fetcher = useCallback(() => analyticsApi.getOverview(), []);
  const { data, error, isLoading, lastUpdated } = useUsageAnalytics(fetcher);

  return (
    <AppLayout title="Overview" headerExtra={<LastUpdated lastUpdated={lastUpdated} isLoading={isLoading} hasError={!!error} />}>
      <div className="flex flex-col gap-4">
        {error && <ErrorBanner message={error.message} />}
        {data?.isMockData && <MockDataBanner />}

        {!data ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <StatCard label="Total sessions" value={data.summary.totalSessions.toLocaleString()} icon={History} accentClassName="text-series-blue" />
              <StatCard
                label="Total input tokens"
                value={formatCompactNumber(data.summary.totalInputTokens)}
                icon={TrendingDown}
                accentClassName="text-series-aqua"
              />
              <StatCard
                label="Total output tokens"
                value={formatCompactNumber(data.summary.totalOutputTokens)}
                icon={TrendingUp}
                accentClassName="text-series-orange"
              />
              <StatCard label="Total tokens" value={formatCompactNumber(data.summary.totalTokens)} icon={Coins} accentClassName="text-series-violet" />
              <StatCard label="Estimated cost" value={formatUsd(data.summary.totalCostUsd)} icon={DollarSign} accentClassName="text-status-good" />
              <StatCard
                label="Average session tokens"
                value={formatCompactNumber(data.summary.averageSessionTokens)}
                icon={Gauge}
                accentClassName="text-series-blue"
              />
              <StatCard label="Most used model" value={data.summary.mostUsedModel ?? '—'} icon={Cpu} accentClassName="text-series-orange" />
              <StatCard
                label="Most active project"
                value={data.summary.mostActiveProject ?? '—'}
                icon={FolderKanban}
                accentClassName="text-series-aqua"
              />
            </div>

            <InsightsList insights={data.insights} />
          </>
        )}
      </div>
    </AppLayout>
  );
}
