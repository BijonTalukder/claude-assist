import { Router, type Request, type Response, type NextFunction } from 'express';
import type { RangeOption } from '@claude-assist/usage';
import { SessionMutationError, type UsageAnalyticsService } from '../usage-analytics-service.js';

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

function parseFlag(req: Request, name: string): boolean {
  const raw = req.query[name];
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value === '1' || value === 'true';
}

/** HTTP status for each way a session mutation can legitimately fail. */
const MUTATION_STATUS: Record<SessionMutationError['reason'], number> = {
  'not-found': 404,
  'mock-data': 409,
  'session-active': 409,
  'file-in-use': 409,
  'outside-claude-directory': 403,
};

function sendMutationError(res: Response, error: SessionMutationError): void {
  res.status(MUTATION_STATUS[error.reason]).json({ error: error.message, reason: error.reason });
}

/** Wraps a mutation so its expected failures become status codes instead of 500s. */
const mutation =
  (handler: (req: Request) => Promise<void>) => async (req: Request, res: Response, next: NextFunction) => {
    try {
      await handler(req);
      res.status(204).end();
    } catch (error) {
      if (error instanceof SessionMutationError) {
        sendMutationError(res, error);
        return;
      }
      next(error);
    }
  };

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
  router.get('/insights', endpoint((s) => ({ insights: s.insights })));

  // Unlike the other slices this one honours `?includeHidden=1`, so hidden sessions can
  // be listed (and unhidden) without ever counting toward the analytics above.
  router.get('/sessions', async (req, res, next) => {
    try {
      const snapshot = await service.getSnapshot({ range: parseRange(req), includeHidden: parseFlag(req, 'includeHidden') });
      res.json({ sessions: snapshot.sessions, ...withMeta(snapshot) });
    } catch (error) {
      next(error);
    }
  });

  router.post('/sessions/:sessionId/hide', mutation((req) => service.hideSession(req.params.sessionId as string)));
  router.delete('/sessions/:sessionId/hide', mutation((req) => service.unhideSession(req.params.sessionId as string)));

  // Permanent: removes the transcript from Claude Code's own data directory. `?force=1`
  // additionally overrides the guard against deleting a session that looks still-active.
  router.delete(
    '/sessions/:sessionId',
    mutation((req) => service.deleteSession(req.params.sessionId as string, { force: parseFlag(req, 'force') })),
  );

  router.get('/status', async (_req, res, next) => {
    try {
      res.json(await service.getStatus());
    } catch (error) {
      next(error);
    }
  });

  return router;
}
