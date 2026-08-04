import type { SessionRecord } from '../types/index.js';
import type { RangeOption } from '../types/analytics.js';
import { DAY_MS, startOfDayUtc, toDateKey } from './time-windows.js';

function isOnDate(timestamp: string, dateKey: string): boolean {
  const then = new Date(timestamp);
  if (Number.isNaN(then.getTime())) return false;
  return toDateKey(then) === dateKey;
}

function isInRange(timestamp: string, fromMs: number, toMs: number): boolean {
  const then = new Date(timestamp).getTime();
  return !Number.isNaN(then) && then >= fromMs && then <= toMs;
}

/**
 * Restricts every session to the turns that fall on `dateKey` (a UTC calendar day,
 * "YYYY-MM-DD" — the same bucketing `buildTrends` uses, so a day picked here lines up
 * with the matching point on the daily trend chart). Sessions left with no turns for
 * that day are dropped entirely, so `totalSessions` (session-ID based, see
 * buildSummary) stays accurate for the filtered view instead of counting sessions that
 * only happened to touch that day's file.
 *
 * `dateKey` undefined/null returns `sessions` unchanged (lifetime view).
 */
export function filterSessionsByDate(sessions: SessionRecord[], dateKey?: string | null): SessionRecord[] {
  if (!dateKey) return sessions;

  const filtered: SessionRecord[] = [];
  for (const session of sessions) {
    const turns = session.turns.filter((turn) => isOnDate(turn.timestamp, dateKey));
    if (turns.length === 0) continue;
    filtered.push({ ...session, turns });
  }
  return filtered;
}

export const RANGE_DAYS: Record<RangeOption, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
  all: Number.POSITIVE_INFINITY,
};

/**
 * Restricts every session to the turns that fall within `range` days of `now`
 * (bucketed from the start of the UTC day `range - 1` days back, so the filter lines
 * up exactly with the daily trend chart's buckets for the same range). Sessions with no
 * turns in the window are dropped. `all` returns `sessions` unchanged (lifetime view).
 */
export function filterSessionsByRange(
  sessions: SessionRecord[],
  range: RangeOption,
  now: Date = new Date(),
): SessionRecord[] {
  const days = RANGE_DAYS[range];
  if (!Number.isFinite(days)) return sessions;

  const fromMs = startOfDayUtc(new Date(now.getTime() - (days - 1) * DAY_MS)).getTime();
  const toMs = now.getTime();

  const filtered: SessionRecord[] = [];
  for (const session of sessions) {
    const turns = session.turns.filter((turn) => isInRange(turn.timestamp, fromMs, toMs));
    if (turns.length === 0) continue;
    filtered.push({ ...session, turns });
  }
  return filtered;
}
