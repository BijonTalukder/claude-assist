# Claude Assist — Usage Analytics Dashboard

A local web dashboard for Claude Code usage: tokens, cost, models, projects, and sessions —
computed entirely from files already on your machine.

```
Claude Code local files  →  Local Parser  →  Analytics Engine  →  Local JSON API  →  React dashboard
   (~/.claude/projects)      (@claude-assist/usage)                (this app's server)   (this app's client)
```

**Everything runs locally.** No external APIs, no Anthropic API key, no cloud sync, no data
upload. The browser never touches the filesystem directly — it only talks to the local
Express server on your machine, which is the only thing that reads `~/.claude`.

## Running it

From the repo root:

```bash
pnpm install
pnpm --filter @claude-assist/usage build   # the analytics engine this app depends on
```

**Development** (hot reload, API + client on separate ports with a proxy):

```bash
pnpm --filter @claude-assist/dashboard dev
```

Client: http://localhost:5173 (Vite) · API: http://localhost:4500 (proxied under `/api`)

**Production** (single process, one port, serves both the built client and the API):

```bash
pnpm --filter @claude-assist/dashboard build
pnpm --filter @claude-assist/dashboard start
```

Open http://localhost:4500.

Config (see `.env.example`):

| Variable | Where | Default | Purpose |
| --- | --- | --- | --- |
| `DASHBOARD_PORT` | server + Vite proxy target | `4500` | Port the API (and, in prod, the whole app) listens on |
| `VITE_REFRESH_INTERVAL` | client | `2000` | Auto-refresh interval in ms (see below) |

## Pages

| Page | Route | Shows |
| --- | --- | --- |
| Overview | `/` | Stat cards (sessions, tokens, cost, avg session, most-used model, most-active project) + deterministic insights |
| Usage | `/usage` | Daily/weekly token trend, session count trend, cost trend |
| Projects | `/projects` | Per-project tokens/cost/sessions, sortable, highest consumer flagged |
| Models | `/models` | Token share per model family + cost/session breakdown |
| Sessions | `/sessions` | Session Explorer: date, project, model, input/output tokens, cost |

## API

All under `/api/analytics`, all `GET`, all JSON:

| Endpoint | Returns |
| --- | --- |
| `/summary` | `{ summary, isMockData, generatedAt }` |
| `/trends` | `{ trends: { daily, weekly }, isMockData, generatedAt }` |
| `/models` | `{ models, isMockData, generatedAt }` |
| `/projects` | `{ projects, isMockData, generatedAt }` |
| `/sessions` | `{ sessions, isMockData, generatedAt }` |
| `/insights` | `{ insights, isMockData, generatedAt }` |
| `/status` | `{ installed, directory, lastScanAt, totalFilesScanned, totalSessionsParsed }` |

`isMockData` is `true` when no local Claude Code history was found — see below. Any unmatched
`/api/*` path returns a real `404` — it does not fall through to the SPA.

The Overview page needs both `summary` and `insights` on one poll; `analyticsApi.getOverview()`
(`src/services/analytics-api.ts`) fetches both endpoints and merges them so the page still makes
one hook call, without the server bundling unrelated concerns into one response.

## Where the data comes from

**Finding Claude's data directory.** `ClaudeDirectoryResolver` checks OS-appropriate candidate
paths (Linux: `~/.claude`, `$XDG_CONFIG_HOME/claude`, `$XDG_DATA_HOME/claude`; macOS:
`~/Library/Application Support/Claude`, `~/.claude`; Windows: `%APPDATA%/Claude`,
`%LOCALAPPDATA%/Claude`, `%USERPROFILE%/.claude`) rather than assuming one path, verifies each
candidate actually looks like a Claude directory (has `projects/`, `settings.json`, or
`history.jsonl` — not just an empty folder that happens to be named right), and picks the most
recently modified one if more than one is real. `/api/analytics/status` reports what it found
(or `installed: false` if nothing did — this never throws).

**Finding files.** `ClaudeFileScanner` recursively walks the resolved directory tagging files by
kind (`.jsonl` → `session-jsonl`, `.db`/`.sqlite` → `sqlite`, `.json` → `json`), skipping
non-data directories (plugin marketplace clones, caches, logs, thumbnails, etc.) so a scan stays
fast. This is a general-purpose, standalone utility — the repository that's actually wired into
the API still targets `projects/*.jsonl` specifically, since that's the one format verified
against real session data. `ClaudeFileScanner` does detect `~/.claude/usage.db` (an internal
SQLite cache some Claude Code versions maintain) as a `sqlite`-kind file, but there's no parser
consuming it yet — it's undocumented, and on this machine was observed to be an incomplete,
lagging index of the same data the `.jsonl` files already have in full. Wiring up a SQLite
reader is a real, scoped follow-up, not implemented here.

**Reading session files.** `@claude-assist/usage` parses
`~/.claude/projects/<project>/<session-uuid>.jsonl` (Claude Code's own local session log —
verified against this project's real files, not assumed) and computes:

- **Tokens** — read directly from each `assistant` turn's usage block.
- **Cost** — Claude Code's session files never include a cost figure, and this machine's own
  model-pricing cache (`~/.claude.json` → `additionalModelCostsCache`) was empty, so there's no
  local source of truth to read it from. Cost is computed from a static, hardcoded pricing
  table (`packages/usage/src/pricing/pricing-table.ts`) — update that file if pricing changes.
- **Insights** — plain rule-based checks over the computed aggregates (dominant model, dominant
  project, a Haiku cost-savings estimate, a large-session flag). No AI model is ever called.

## Mock data

A fresh machine with no Claude Code history yet would otherwise show a blank dashboard. Instead,
`UsageAnalyticsService` falls back to `generateMockSessions()` (`@claude-assist/usage`) —
clearly flagged via `isMockData: true` in every response, and surfaced in the UI as a banner. It
is never blended with real data.

## Auto-refresh

`useUsageAnalytics` (`src/hooks/useUsageAnalytics.ts`) is a generic polling hook every page
reuses — pass it a fetcher, get back `{ data, error, isLoading, lastUpdated }`:

```ts
const { data, error, lastUpdated } = useUsageAnalytics(() => analyticsApi.getSummary());
```

- Polls on an interval (default 2000ms, `VITE_REFRESH_INTERVAL`), via React state — no page
  reloads.
- `clearInterval` on unmount (cleanup effect return) — no leaked timers.
- On a failed poll, the previous successful `data` stays on screen; only `error` changes, so a
  flaky request doesn't blank the dashboard. Every page shows a small live/error indicator with
  the last-updated time (`LastUpdated.tsx`).

## Architecture

```
apps/dashboard/
├── server/                   Express — the only thing that reads ~/.claude
│   ├── usage-analytics-service.ts   resolves the Claude directory, loads sessions (cached), falls back to mock data, computes the bundle + install status
│   ├── routes/usage-routes.ts        the 7 GET endpoints — thin slices of one snapshot, plus /status
│   ├── app.ts                        Express app: API + 404 for unmatched /api/* + (in prod) serves the built client
│   └── index.ts                      entrypoint
│
└── src/                       React (Vite) — never touches the filesystem
    ├── pages/                 Dashboard, Usage, Projects, Models, Sessions
    ├── components/            StatCard, UsageChart, ModelChart, ProjectTable, SessionsTable, …
    ├── hooks/useUsageAnalytics.ts   the one polling hook every page reuses
    ├── services/analytics-api.ts    typed fetch wrappers, one per endpoint
    └── types/                 re-exports analytics types from @claude-assist/usage
```

Colors, chart marks (2px lines, hairline gridlines, fixed categorical order by model identity —
never by rank) and the stat-tile layout follow this repo's dataviz conventions; the dark palette
in `tailwind.config.cjs` is used as-is, unmodified.

The client never imports *runtime* code from `@claude-assist/usage` (only `import type`) — that
package also re-exports the Node-only parser (`fs`, `readline`, `os`), and a real import would
pull that into the browser bundle. Anything the UI needs that only the server can compute (e.g.
a model's display name) is resolved server-side and included in the API response instead.

## Future extension points

- **Cloud sync** — deliberately not implemented. If ever added, it should be an *opt-in*
  provider behind a narrow interface (e.g. `UsageSyncProvider.push(bundle)`) called from
  `UsageAnalyticsService`, so local-only usage keeps working identically with sync disabled.
- **CLI integration** — done: `claude-assist analytics` (and the menu's "📊 Usage Analytics")
  resolve this package via `import.meta.resolve('@claude-assist/dashboard/package.json')`, spawn
  its compiled `dist/server/index.js` as a child process, poll `/api/analytics/status` until it's
  ready, and open the default browser. See `apps/cli/src/commands/analytics.ts`.
- **Caching** — `CachingUsageSessionRepository` keeps parsed sessions keyed by file mtime, so a
  2-second poll only re-parses `.jsonl` files that actually changed since the last call (stale
  entries for deleted sessions are dropped too). The analytics *aggregation* on top still
  recomputes every request — fine at personal-history scale; if that ever shows up as the
  bottleneck, memoizing `UsageAnalyticsEngine.buildAll` on the same session-set identity would be
  the next step.
- **SQLite ingestion** — `ClaudeFileScanner` already finds and tags `.db`/`.sqlite` files; adding
  a `SqliteSessionParser` behind the same interface as the `.jsonl` parser is the natural way to
  add a second format without touching the discovery layer.
- **Auth** — none exists because everything is `localhost`-only; if this ever listens beyond
  localhost, add auth before doing so, not after.
