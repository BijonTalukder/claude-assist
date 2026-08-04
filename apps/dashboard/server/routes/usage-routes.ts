import { Router, type Request, type Response, type NextFunction } from 'express';
import type { UsageAnalyticsService } from '../usage-analytics-service.js';

type Snapshot = Awaited<ReturnType<UsageAnalyticsService['getSnapshot']>>;
type SnapshotSlice = (snapshot: Snapshot) => Record<string, unknown>;

function withMeta(snapshot: Snapshot): { isMockData: boolean; generatedAt: string } {
  return { isMockData: snapshot.isMockData, generatedAt: snapshot.generatedAt };
}

export function createUsageRouter(service: UsageAnalyticsService): Router {
  const router = Router();

  const endpoint = (slice: SnapshotSlice) => async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const snapshot = await service.getSnapshot();
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
