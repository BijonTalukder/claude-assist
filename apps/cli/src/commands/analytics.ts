import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execa } from 'execa';
import ora from 'ora';
import pc from 'picocolors';

export interface AnalyticsCommandOptions {
  port?: number;
}

const DEFAULT_PORT = 4500;
const SERVER_READY_TIMEOUT_MS = 8000;
const SERVER_READY_POLL_MS = 150;

async function resolveDashboardServerEntry(): Promise<string> {
  const packageJsonUrl = await import.meta.resolve('@claude-assist/dashboard/package.json');
  const packageRoot = dirname(fileURLToPath(packageJsonUrl));
  return join(packageRoot, 'dist', 'server', 'index.js');
}

async function waitForServerReady(port: number, timeoutMs: number): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://localhost:${port}/api/analytics/status`);
      if (response.ok) return true;
    } catch {
      // Not listening yet — keep polling.
    }
    await new Promise((resolve) => setTimeout(resolve, SERVER_READY_POLL_MS));
  }

  return false;
}

async function openBrowser(url: string): Promise<void> {
  const platform = process.platform;
  const command = platform === 'darwin' ? 'open' : platform === 'win32' ? 'cmd' : 'xdg-open';
  const args = platform === 'win32' ? ['/c', 'start', '""', url] : [url];

  try {
    await execa(command, args, { stdio: 'ignore' });
  } catch {
    // No GUI/browser available in this environment — not fatal, the URL is already printed.
  }
}

function wasStoppedBySignal(error: unknown): boolean {
  const signal = (error as { signal?: string } | undefined)?.signal;
  return signal === 'SIGINT' || signal === 'SIGTERM';
}

/**
 * Resolves with the signal that stopped us. Registering a listener here is what matters:
 * without one, Node's default SIGINT behavior is to terminate immediately, which would skip
 * the cleanup in runAnalyticsCommand entirely.
 */
function waitForStopSignal(): Promise<NodeJS.Signals> {
  return new Promise((resolve) => {
    const onSignal = (signal: NodeJS.Signals) => resolve(signal);
    process.once('SIGINT', onSignal);
    process.once('SIGTERM', onSignal);
  });
}

type RunOutcome = { type: 'stopped-by-user'; signal: NodeJS.Signals } | { type: 'server-exited' };

export async function runAnalyticsCommand(options: AnalyticsCommandOptions = {}): Promise<void> {
  const port = options.port ?? DEFAULT_PORT;
  const url = `http://localhost:${port}`;

  let serverEntry: string;
  try {
    serverEntry = await resolveDashboardServerEntry();
  } catch {
    throw new Error(
      'Could not find the dashboard server. Build it first: pnpm --filter @claude-assist/dashboard build',
    );
  }

  const spinner = ora('Starting the usage analytics dashboard...').start();

  const serverProcess = execa('node', [serverEntry], {
    env: { ...process.env, DASHBOARD_PORT: String(port) },
    stdio: 'inherit',
  });

  const ready = await waitForServerReady(port, SERVER_READY_TIMEOUT_MS);
  if (ready) {
    spinner.succeed(`Dashboard running at ${pc.cyan(url)}`);
  } else {
    spinner.warn(`Dashboard is taking longer than expected to start — opening ${pc.cyan(url)} anyway.`);
  }

  await openBrowser(url);
  console.log(pc.dim('Press Ctrl+C to stop the dashboard.'));

  const outcome = await Promise.race<RunOutcome>([
    waitForStopSignal().then((signal) => ({ type: 'stopped-by-user', signal })),
    serverProcess.then(
      (): RunOutcome => ({ type: 'server-exited' }),
      (error: unknown): RunOutcome => {
        if (wasStoppedBySignal(error)) return { type: 'server-exited' };
        throw error;
      },
    ),
  ]);

  if (outcome.type === 'stopped-by-user') {
    serverProcess.kill(outcome.signal);
    await serverProcess.catch(() => {});
  }

  console.log(pc.dim('Dashboard stopped.'));
}
