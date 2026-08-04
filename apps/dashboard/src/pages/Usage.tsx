import { useCallback } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { UsageChart } from '../components/UsageChart';
import { LastUpdated } from '../components/LastUpdated';
import { ErrorBanner } from '../components/ErrorBanner';
import { MockDataBanner } from '../components/MockDataBanner';
import { Skeleton } from '../components/ui/skeleton';
import { useUsageAnalytics } from '../hooks/useUsageAnalytics';
import { analyticsApi } from '../services/analytics-api';
import { formatCompactNumber, formatUsd } from '../lib/utils';

export function Usage() {
  const fetcher = useCallback(() => analyticsApi.getTrends(), []);
  const { data, error, isLoading, lastUpdated } = useUsageAnalytics(fetcher);

  return (
    <AppLayout title="Usage" headerExtra={<LastUpdated lastUpdated={lastUpdated} isLoading={isLoading} hasError={!!error} />}>
      <div className="flex flex-col gap-4">
        {error && <ErrorBanner message={error.message} />}
        {data?.isMockData && <MockDataBanner />}

        {!data ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <UsageChart
              title="Daily token usage"
              data={data.trends.daily.map((p) => ({ date: p.date, value: p.totalTokens }))}
              color="#3987e5"
              valueFormatter={formatCompactNumber}
            />
            <UsageChart
              title="Weekly token usage"
              data={data.trends.weekly.map((p) => ({ date: p.date, value: p.totalTokens }))}
              color="#9085e9"
              valueFormatter={formatCompactNumber}
            />
            <UsageChart
              title="Session count trend"
              data={data.trends.daily.map((p) => ({ date: p.date, value: p.sessionCount }))}
              color="#199e70"
              valueFormatter={(v) => v.toLocaleString()}
            />
            <UsageChart
              title="Cost trend"
              data={data.trends.daily.map((p) => ({ date: p.date, value: p.totalCostUsd }))}
              color="#d95926"
              valueFormatter={formatUsd}
            />
          </div>
        )}
      </div>
    </AppLayout>
  );
}
