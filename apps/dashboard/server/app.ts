import express, { type Express, type NextFunction, type Request, type Response } from 'express';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { createUsageRouter } from './routes/usage-routes.js';
import { UsageAnalyticsService } from './usage-analytics-service.js';

// This server is bundled to CJS and run standalone via `node`, where `__dirname` is a
// runtime global pointing at the compiled file's directory (e.g.
// .../assets/dashboard/server). The `typeof` guard keeps this source runnable as ESM
// during dev (tsx), where the CJS globals don't exist and the static-client branch
// below is skipped anyway.
const currentDir: string = typeof __dirname === 'string' ? __dirname : process.cwd();

export function createApp(): Express {
  const app = express();
  const service = new UsageAnalyticsService();

  app.use('/api/analytics', createUsageRouter(service));

  // An unmatched /api/* route is a real 404, not a page — without this, it would fall
  // through to the SPA catch-all below and silently return index.html with a 200.
  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  // In production `pnpm build` puts the built client next to this compiled server file
  // (dist/client vs dist/server) — serve it if present. In dev, Vite serves the client
  // itself and proxies /api here instead, so this branch is simply skipped.
  const clientDistDir = join(currentDir, '..', 'client');
  if (existsSync(clientDistDir)) {
    app.use(express.static(clientDistDir));
    app.get('*', (_req, res) => {
      res.sendFile(join(clientDistDir, 'index.html'));
    });
  }

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}
