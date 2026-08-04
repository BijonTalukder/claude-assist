import { useCallback } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { ModelChart } from '../components/ModelChart';
import { ModelShareMeter } from '../components/ModelShareMeter';
import { LastUpdated } from '../components/LastUpdated';
import { ErrorBanner } from '../components/ErrorBanner';
import { MockDataBanner } from '../components/MockDataBanner';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import { EmptyState } from '../components/EmptyState';
import { useUsageAnalytics } from '../hooks/useUsageAnalytics';
import { analyticsApi } from '../services/analytics-api';

export function Models() {
  const fetcher = useCallback(() => analyticsApi.getModels(), []);
  const { data, error, isLoading, lastUpdated } = useUsageAnalytics(fetcher);

  return (
    <AppLayout title="Models" headerExtra={<LastUpdated lastUpdated={lastUpdated} isLoading={isLoading} hasError={!!error} />}>
      <div className="flex flex-col gap-4">
        {error && <ErrorBanner message={error.message} />}
        {data?.isMockData && <MockDataBanner />}

        {!data ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <ModelChart models={data.models} />

            <Card>
              <CardHeader>
                <CardTitle>Share of usage</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-5">
                {data.models.length === 0 ? (
                  <EmptyState title="No model usage yet" />
                ) : (
                  data.models.map((model) => <ModelShareMeter key={model.model} model={model} />)
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
