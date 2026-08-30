import { useCallback, useState } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { SessionsTable } from '../components/SessionsTable';
import { LastUpdated } from '../components/LastUpdated';
import { ErrorBanner } from '../components/ErrorBanner';
import { MockDataBanner } from '../components/MockDataBanner';
import { ClaudeNotDetected } from '../components/ClaudeNotDetected';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import { useUsageAnalytics } from '../hooks/useUsageAnalytics';
import { analyticsApi, SessionMutationFailed } from '../services/analytics-api';
import { useRangeFilter } from '../components/RangeFilter';

export function Sessions() {
  const range = useRangeFilter();
  const [showHidden, setShowHidden] = useState(false);
  const [pendingSessionId, setPendingSessionId] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  // Set when a delete was refused for looking active, so the row can offer "Delete anyway".
  const [activeConflictSessionId, setActiveConflictSessionId] = useState<string | null>(null);

  const fetcher = useCallback(() => analyticsApi.getSessions(range, showHidden), [range, showHidden]);
  const { data, error, isLoading, lastUpdated, refetch } = useUsageAnalytics(fetcher);

  /**
   * Runs one mutation and refetches on success. A refusal is surfaced as a banner rather
   * than thrown — these are expected outcomes (still-active session, locked file), not bugs.
   */
  const runMutation = useCallback(
    async (sessionId: string, action: () => Promise<void>) => {
      setPendingSessionId(sessionId);
      setMutationError(null);
      try {
        await action();
        setActiveConflictSessionId(null);
        refetch();
      } catch (err) {
        const failure = err instanceof SessionMutationFailed ? err : null;
        setMutationError(failure?.message ?? 'The request failed.');
        setActiveConflictSessionId(failure?.reason === 'session-active' ? sessionId : null);
      } finally {
        setPendingSessionId(null);
      }
    },
    [refetch],
  );

  const handleHide = useCallback((id: string) => runMutation(id, () => analyticsApi.hideSession(id)), [runMutation]);
  const handleUnhide = useCallback((id: string) => runMutation(id, () => analyticsApi.unhideSession(id)), [runMutation]);
  const handleDelete = useCallback(
    (id: string, force: boolean) => runMutation(id, () => analyticsApi.deleteSession(id, force)),
    [runMutation],
  );

  // Mock data has no real transcripts behind it, so offer no actions that imply otherwise.
  const canMutate = Boolean(data && !data.isMockData && data.claudeInstalled);

  return (
    <AppLayout title="Sessions" headerExtra={<LastUpdated lastUpdated={lastUpdated} isLoading={isLoading} hasError={!!error} />}>
      <div className="flex flex-col gap-4">
        {error && <ErrorBanner message={error.message} />}
        {mutationError && <ErrorBanner message={mutationError} />}
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
            <CardContent className="flex flex-col gap-3">
              {canMutate && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-ink-muted">Hidden sessions are excluded from every other view.</span>
                  <Button variant={showHidden ? 'active' : 'ghost'} onClick={() => setShowHidden((value) => !value)}>
                    Show hidden sessions
                  </Button>
                </div>
              )}
              <SessionsTable
                sessions={data.sessions}
                onHide={canMutate ? handleHide : undefined}
                onUnhide={canMutate ? handleUnhide : undefined}
                onDelete={canMutate ? handleDelete : undefined}
                pendingSessionId={pendingSessionId}
                activeConflictSessionId={activeConflictSessionId}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
