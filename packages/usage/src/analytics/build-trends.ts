import type { TrendPoint, UsageTrends } from '../types/analytics.js';
import type { ResolvedTurn } from './resolved-turn.js';
import { DAY_MS, startOfDayUtc, startOfWeekUtc, toDateKey } from './time-windows.js';

interface MutableBucket {
  totalTokens: number;
  totalCostUsd: number;
  sessionIds: Set<string>;
}

function emptyBucket(): MutableBucket {
  return { totalTokens: 0, totalCostUsd: 0, sessionIds: new Set() };
}

function toTrendPoint(date: string, bucket: MutableBucket): TrendPoint {
  return { date, totalTokens: bucket.totalTokens, totalCostUsd: bucket.totalCostUsd, sessionCount: bucket.sessionIds.size };
}

const DAILY_TREND_DAYS = 30;
const WEEKLY_TREND_WEEKS = 12;

/** Zero-filled so a quiet day/week still renders as a point instead of a gap. */
function buildDailyTrend(turns: ResolvedTurn[], now: Date): TrendPoint[] {
  const todayUtc = startOfDayUtc(now);
  const buckets = new Map<string, MutableBucket>();

  for (let i = DAILY_TREND_DAYS - 1; i >= 0; i--) {
    const day = new Date(todayUtc.getTime() - i * DAY_MS);
    buckets.set(toDateKey(day), emptyBucket());
  }

  for (const turn of turns) {
    const key = toDateKey(new Date(turn.timestamp));
    const bucket = buckets.get(key);
    if (!bucket) continue;
    bucket.totalTokens += turn.totalTokens;
    bucket.totalCostUsd += turn.costUsd;
    bucket.sessionIds.add(turn.sessionId);
  }

  return Array.from(buckets.entries()).map(([date, bucket]) => toTrendPoint(date, bucket));
}

function buildWeeklyTrend(turns: ResolvedTurn[], now: Date): TrendPoint[] {
  const currentWeekStart = startOfWeekUtc(now);
  const buckets = new Map<string, MutableBucket>();

  for (let i = WEEKLY_TREND_WEEKS - 1; i >= 0; i--) {
    const weekStart = new Date(currentWeekStart.getTime() - i * 7 * DAY_MS);
    buckets.set(toDateKey(weekStart), emptyBucket());
  }

  for (const turn of turns) {
    const key = toDateKey(startOfWeekUtc(new Date(turn.timestamp)));
    const bucket = buckets.get(key);
    if (!bucket) continue;
    bucket.totalTokens += turn.totalTokens;
    bucket.totalCostUsd += turn.costUsd;
    bucket.sessionIds.add(turn.sessionId);
  }

  return Array.from(buckets.entries()).map(([date, bucket]) => toTrendPoint(date, bucket));
}

export function buildTrends(turns: ResolvedTurn[], now: Date): UsageTrends {
  return {
    daily: buildDailyTrend(turns, now),
    weekly: buildWeeklyTrend(turns, now),
  };
}
