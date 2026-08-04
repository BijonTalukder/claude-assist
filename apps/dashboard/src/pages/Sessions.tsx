import { useCallback } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { SessionsTable } from '../components/SessionsTable';
import { LastUpdated } from '../components/LastUpdated';
import { ErrorBanner } from '../components/ErrorBanner';
import { MockDataBanner } from '../components/MockDataBanner';
import { Card, CardContent } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import { useUsageAnalytics } from '../hooks/useUsageAnalytics';
import { analyticsApi } from '../services/analytics-api';

export function Sessions() {
  const fetcher = useCallback(() => analyticsApi.getSessions(), []);
  const { data, error, isLoading, lastUpdated } = useUsageAnalytics(fetcher);

  return (
    <AppLayout title="Sessions" headerExtra={<LastUpdated lastUpdated={lastUpdated} isLoading={isLoading} hasError={!!error} />}>
      <div className="flex flex-col gap-4">
        {error && <ErrorBanner message={error.message} />}
        {data?.isMockData && <MockDataBanner />}

        <Card>
          <CardContent>{!data ? <Skeleton className="h-64" /> : <SessionsTable sessions={data.sessions} />}</CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
