import { existsSync } from "node:fs";
import { createServer } from "node:net";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execa } from "execa";
import ora from "ora";
import pc from "picocolors";

export interface AnalyticsCommandOptions {
  port?: number;
}

const DEFAULT_PORT = 4500;
const SERVER_READY_TIMEOUT_MS = 8000;
const SERVER_READY_POLL_MS = 150;
const MAX_PORT_FALLBACK_ATTEMPTS = 20;

/** True when nothing is listening on `port` (best-effort check). */
function isPortFree(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer();
    server.once("error", () => resolve(false));
    server.listen(port, () => server.close(() => resolve(true)));
  });
}

/** Returns the first free port at or above `startPort`, up to a bounded number of tries. */
async function findAvailablePort(startPort: number): Promise<number> {
  for (let port = startPort; port < startPort + MAX_PORT_FALLBACK_ATTEMPTS; port++) {
    if (await isPortFree(port)) return port;
  }
  return startPort;
}

function resolveDashboardServerEntry(): string {
  // dist/index.js is a single bundled file at the package root's dist/ dir,
  // so the package root is one level up — not two.
  const cliRoot = dirname(fileURLToPath(import.meta.url));
  const serverEntry = resolve(
    cliRoot,
    "..",
    "assets",
    "dashboard",
    "server",
    "index.cjs",
  );

  if (!existsSync(serverEntry)) {
    throw new Error(
      `Could not find the dashboard server at ${serverEntry}. Build the CLI package first.`,
    );
  }

  return serverEntry;
}

async function waitForServerReady(
  port: number,
  timeoutMs: number,
): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(
        `http://localhost:${port}/api/analytics/status`,
      );
      if (response.ok) return true;
    } catch {
      // Not listening yet — keep polling.
    }
    await new Promise((resolve) => setTimeout(resolve, SERVER_READY_POLL_MS));
  }

  return false;
}

/** True when a dashboard server is already answering on `port`. */
async function isDashboardResponding(port: number): Promise<boolean> {
  try {
    const response = await fetch(
      `http://localhost:${port}/api/analytics/status`,
      { signal: AbortSignal.timeout(1000) },
    );
    return response.ok;
  } catch {
    return false;
  }
}

async function openBrowser(url: string): Promise<void> {
  const platform = process.platform;
  const command =
    platform === "darwin" ? "open" : platform === "win32" ? "cmd" : "xdg-open";
  const args = platform === "win32" ? ["/c", "start", '""', url] : [url];

  try {
    await execa(command, args, { stdio: "ignore" });
  } catch {
    // No GUI/browser available in this environment — not fatal, the URL is already printed.
  }
}

function wasStoppedBySignal(error: unknown): boolean {
  const signal = (error as { signal?: string } | undefined)?.signal;
  return signal === "SIGINT" || signal === "SIGTERM";
}

/**
 * Resolves with the signal that stopped us. Registering a listener here is what matters:
 * without one, Node's default SIGINT behavior is to terminate immediately, which would skip
 * the cleanup in runAnalyticsCommand entirely.
 */
function waitForStopSignal(): Promise<NodeJS.Signals> {
  return new Promise((resolve) => {
    const onSignal = (signal: NodeJS.Signals) => resolve(signal);
    process.once("SIGINT", onSignal);
    process.once("SIGTERM", onSignal);
  });
}

type RunOutcome =
  | { type: "stopped-by-user"; signal: NodeJS.Signals }
  | { type: "server-exited" };

export async function runAnalyticsCommand(
  options: AnalyticsCommandOptions = {},
): Promise<void> {
  const requestedPort = options.port ?? DEFAULT_PORT;

  // If a dashboard is already running on the requested port, reuse it instead of
  // starting a second server — two instances can't bind the same port, and killing a
  // process we didn't start would be wrong. This is what happens when a previous
  // `claude-assist analytics` was left running (its server is still serving the port).
  if (await isDashboardResponding(requestedPort)) {
    const url = `http://localhost:${requestedPort}`;
    console.log(pc.dim(`Dashboard is already running — opening ${pc.cyan(url)}.`));
    await openBrowser(url);
    return;
  }

  const port = await findAvailablePort(requestedPort);
  const url = `http://localhost:${port}`;

  if (port !== requestedPort) {
    console.log(
      pc.yellow(`Port ${requestedPort} is already in use — starting the dashboard on port ${port} instead.`),
    );
  }

  let serverEntry: string;
  try {
    serverEntry = resolveDashboardServerEntry();
  } catch (error) {
    throw error;
  }

  const spinner = ora("Starting the usage analytics dashboard...").start();

  const serverProcess = execa("node", [serverEntry], {
    env: { ...process.env, DASHBOARD_PORT: String(port) },
    stdio: "inherit",
  });

  const ready = await waitForServerReady(port, SERVER_READY_TIMEOUT_MS);
  if (ready) {
    spinner.succeed(`Dashboard running at ${pc.cyan(url)}`);
  } else {
    spinner.warn(
      `Dashboard is taking longer than expected to start — opening ${pc.cyan(url)} anyway.`,
    );
  }

  await openBrowser(url);
  console.log(pc.dim("Press Ctrl+C to stop the dashboard."));

  const outcome = await Promise.race<RunOutcome>([
    waitForStopSignal().then((signal) => ({ type: "stopped-by-user", signal })),
    serverProcess.then(
      (): RunOutcome => ({ type: "server-exited" }),
      async (error: unknown): Promise<RunOutcome> => {
        if (wasStoppedBySignal(error)) return { type: "server-exited" };
        // A second dashboard may have claimed the port between our free-port check and
        // the spawned server's listen() (EADDRINUSE). If the port actually answers now,
        // that's a dashboard already running — not a failure worth throwing.
        if (await isDashboardResponding(port)) return { type: "server-exited" };
        throw error;
      },
    ),
  ]);

  if (outcome.type === "stopped-by-user") {
    serverProcess.kill(outcome.signal);
    await serverProcess.catch(() => {});
  }

  console.log(pc.dim("Dashboard stopped."));
}
