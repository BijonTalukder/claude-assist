import { Router, type Request, type Response, type NextFunction } from 'express';
import type { RangeOption } from '@claude-assist/usage';
import type { UsageAnalyticsService } from '../usage-analytics-service.js';

type Snapshot = Awaited<ReturnType<UsageAnalyticsService['getSnapshot']>>;
type SnapshotSlice = (snapshot: Snapshot) => Record<string, unknown>;

function withMeta(snapshot: Snapshot): { range: RangeOption; claudeInstalled: boolean; isMockData: boolean; generatedAt: string } {
  return { range: snapshot.range, claudeInstalled: snapshot.claudeInstalled, isMockData: snapshot.isMockData, generatedAt: snapshot.generatedAt };
}

const RANGES: RangeOption[] = ['7d', '30d', '90d', 'all'];

/** Reads and validates the `?range=` query param; defaults to 'all' for anything unknown. */
function parseRange(req: Request): RangeOption {
  const raw = req.query.range;
  const value = Array.isArray(raw) ? raw[0] : raw;
  return typeof value === 'string' && (RANGES as string[]).includes(value) ? (value as RangeOption) : 'all';
}

export function createUsageRouter(service: UsageAnalyticsService): Router {
  const router = Router();

  const endpoint = (slice: SnapshotSlice) => async (req: Request, res: Response, next: NextFunction) => {
    try {
      const snapshot = await service.getSnapshot({ range: parseRange(req) });
      res.json({ ...slice(snapshot), ...withMeta(snapshot) });
    } catch (error) {
      next(error);
    }
  };

  router.get('/summary', endpoint((s) => ({ summary: s.summary })));
  router.get('/trends', endpoint((s) => ({ trends: s.trends })));
  router.get('/models', endpoint((s) => ({ models: s.models })));
  router.get('/projects', endpoint((s) => ({ projects: s.projects })));
  router.get('/sessions', endpoint((s) => ({ sessions: s.sessions })));
  router.get('/insights', endpoint((s) => ({ insights: s.insights })));

  router.get('/status', async (_req, res, next) => {
    try {
      res.json(await service.getStatus());
    } catch (error) {
      next(error);
    }
  });

  return router;
}
