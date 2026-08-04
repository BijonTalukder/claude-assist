import { useCallback } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { ProjectTable } from '../components/ProjectTable';
import { LastUpdated } from '../components/LastUpdated';
import { ErrorBanner } from '../components/ErrorBanner';
import { MockDataBanner } from '../components/MockDataBanner';
import { Card, CardContent } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import { useUsageAnalytics } from '../hooks/useUsageAnalytics';
import { analyticsApi } from '../services/analytics-api';

export function Projects() {
  const fetcher = useCallback(() => analyticsApi.getProjects(), []);
  const { data, error, isLoading, lastUpdated } = useUsageAnalytics(fetcher);

  return (
    <AppLayout title="Projects" headerExtra={<LastUpdated lastUpdated={lastUpdated} isLoading={isLoading} hasError={!!error} />}>
      <div className="flex flex-col gap-4">
        {error && <ErrorBanner message={error.message} />}
        {data?.isMockData && <MockDataBanner />}

        <Card>
          <CardContent>{!data ? <Skeleton className="h-64" /> : <ProjectTable projects={data.projects} />}</CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
