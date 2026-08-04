import { useCallback } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { ProjectTable } from '../components/ProjectTable';
import { LastUpdated } from '../components/LastUpdated';
import { ErrorBanner } from '../components/ErrorBanner';
import { MockDataBanner } from '../components/MockDataBanner';
import { ClaudeNotDetected } from '../components/ClaudeNotDetected';
import { Card, CardContent } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import { useUsageAnalytics } from '../hooks/useUsageAnalytics';
import { analyticsApi } from '../services/analytics-api';
import { useRangeFilter } from '../components/RangeFilter';

export function Projects() {
  const range = useRangeFilter();
  const fetcher = useCallback(() => analyticsApi.getProjects(range), [range]);
  const { data, error, isLoading, lastUpdated } = useUsageAnalytics(fetcher);

  return (
    <AppLayout title="Projects" headerExtra={<LastUpdated lastUpdated={lastUpdated} isLoading={isLoading} hasError={!!error} />}>
      <div className="flex flex-col gap-4">
        {error && <ErrorBanner message={error.message} />}
        {data?.isMockData && <MockDataBanner />}

        {!data ? (
          <Card>
            <CardContent>
              <Skeleton className="h-64" />
            </CardContent>
          </Card>
        ) : data.claudeInstalled === false ? (
          <ClaudeNotDetected />
        ) : (
          <Card>
            <CardContent>
              <ProjectTable projects={data.projects} />
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
