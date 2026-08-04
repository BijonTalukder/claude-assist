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

const DEFAULT_DAILY_TREND_DAYS = 30;
const DEFAULT_WEEKLY_TREND_WEEKS = 12;

export interface TrendWindow {
  dailyDays: number;
  weeklyWeeks: number;
}

export const DEFAULT_TREND_WINDOW: TrendWindow = {
  dailyDays: DEFAULT_DAILY_TREND_DAYS,
  weeklyWeeks: DEFAULT_WEEKLY_TREND_WEEKS,
};

/** Zero-filled so a quiet day/week still renders as a point instead of a gap. */
function buildDailyTrend(turns: ResolvedTurn[], now: Date, windowDays: number): TrendPoint[] {
  const todayUtc = startOfDayUtc(now);
  const buckets = new Map<string, MutableBucket>();

  for (let i = windowDays - 1; i >= 0; i--) {
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

function buildWeeklyTrend(turns: ResolvedTurn[], now: Date, windowWeeks: number): TrendPoint[] {
  const currentWeekStart = startOfWeekUtc(now);
  const buckets = new Map<string, MutableBucket>();

  for (let i = windowWeeks - 1; i >= 0; i--) {
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

export function buildTrends(turns: ResolvedTurn[], now: Date, window: TrendWindow = DEFAULT_TREND_WINDOW): UsageTrends {
  return {
    daily: buildDailyTrend(turns, now, window.dailyDays),
    weekly: buildWeeklyTrend(turns, now, window.weeklyWeeks),
  };
}
