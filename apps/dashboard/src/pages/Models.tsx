import { useCallback } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { ModelChart } from '../components/ModelChart';
import { ModelShareMeter } from '../components/ModelShareMeter';
import { LastUpdated } from '../components/LastUpdated';
import { ErrorBanner } from '../components/ErrorBanner';
import { MockDataBanner } from '../components/MockDataBanner';
import { ClaudeNotDetected } from '../components/ClaudeNotDetected';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import { EmptyState } from '../components/EmptyState';
import { useUsageAnalytics } from '../hooks/useUsageAnalytics';
import { analyticsApi } from '../services/analytics-api';
import { useRangeFilter } from '../components/RangeFilter';

export function Models() {
  const range = useRangeFilter();
  const fetcher = useCallback(() => analyticsApi.getModels(range), [range]);
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
        ) : data.claudeInstalled === false ? (
          <ClaudeNotDetected />
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
