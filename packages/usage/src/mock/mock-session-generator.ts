import type { SessionRecord, UsageTurn } from '../types/index.js';

const MOCK_PROJECTS = ['/home/demo/projects/api-service', '/home/demo/projects/web-app', '/home/demo/projects/mobile-app'];
const MOCK_MODELS = ['claude-sonnet-5', 'claude-sonnet-5', 'claude-sonnet-5', 'claude-opus-5', 'claude-haiku-4-5'];
const MOCK_SESSION_COUNT = 24;
const MOCK_HISTORY_DAYS = 30;
const MOCK_TURNS_PER_SESSION_RANGE: [number, number] = [3, 18];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(items: T[]): T {
  return items[randomInt(0, items.length - 1)] as T;
}

/** Deterministic-looking but randomized sample data — for the empty-state demo, never mixed with real history. */
export function generateMockSessions(now: Date = new Date()): SessionRecord[] {
  const sessions: SessionRecord[] = [];

  for (let i = 0; i < MOCK_SESSION_COUNT; i++) {
    const projectPath = pick(MOCK_PROJECTS);
    const model = pick(MOCK_MODELS);
    const daysAgo = randomInt(0, MOCK_HISTORY_DAYS);
    const sessionStart = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000 - randomInt(0, 12) * 60 * 60 * 1000);

    const turnCount = randomInt(...MOCK_TURNS_PER_SESSION_RANGE);
    const turns: UsageTurn[] = [];
    let cursor = sessionStart.getTime();

    for (let t = 0; t < turnCount; t++) {
      cursor += randomInt(20, 240) * 1000;
      turns.push({
        sessionId: `mock-session-${i}`,
        projectPath,
        timestamp: new Date(cursor).toISOString(),
        model,
        gitBranch: 'main',
        isSidechain: false,
        tokens: {
          input: randomInt(50, 400),
          output: randomInt(200, 4000),
          cacheRead: randomInt(0, 20000),
          cacheCreation: randomInt(0, 8000),
        },
      });
    }

    sessions.push({
      sessionId: `mock-session-${i}`,
      projectPath,
      projectDirName: projectPath.replace(/\//g, '-'),
      title: 'Sample session',
      cliVersion: 'mock',
      firstTimestamp: sessionStart.toISOString(),
      lastTimestamp: new Date(cursor).toISOString(),
      turns,
      turnDurations: [],
      sourceFile: 'mock',
    });
  }

  return sessions;
}
