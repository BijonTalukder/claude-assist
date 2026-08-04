import { useEffect, useRef, useState } from 'react';

export const DEFAULT_REFRESH_INTERVAL_MS = Number(import.meta.env.VITE_REFRESH_INTERVAL ?? 2000);

export interface UseUsageAnalyticsResult<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  lastUpdated: Date | null;
}

/**
 * Polls `fetcher` every `intervalMs` and mirrors the result into React state — no
 * page reloads. On failure the previous successful `data` is kept on screen (only
 * `error` changes), so a flaky poll doesn't blank out the dashboard.
 */
export function useUsageAnalytics<T>(
  fetcher: () => Promise<T>,
  intervalMs: number = DEFAULT_REFRESH_INTERVAL_MS,
): UseUsageAnalyticsResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Callers pass a fresh arrow function on every render; capturing it in a ref (rather
  // than the effect's dependency array) means the interval isn't torn down and
  // recreated on every render — only a real `intervalMs` change should do that.
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const result = await fetcherRef.current();
        if (cancelled) return;
        setData(result);
        setError(null);
        setLastUpdated(new Date());
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err : new Error('Failed to fetch analytics data.'));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    const interval = setInterval(load, intervalMs);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [intervalMs]);

  return { data, error, isLoading, lastUpdated };
}
