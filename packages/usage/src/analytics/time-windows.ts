export const DAY_MS = 24 * 60 * 60 * 1000;

export function startOfDayUtc(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/** Monday-anchored start of the ISO week containing `date`, at UTC midnight. */
export function startOfWeekUtc(date: Date): Date {
  const start = startOfDayUtc(date);
  const isoDayOfWeek = start.getUTCDay() === 0 ? 7 : start.getUTCDay(); // 1 = Monday ... 7 = Sunday
  start.setUTCDate(start.getUTCDate() - (isoDayOfWeek - 1));
  return start;
}

export function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function isWithinLastNDays(timestamp: string, now: Date, days: number): boolean {
  const then = new Date(timestamp).getTime();
  if (Number.isNaN(then)) return false;
  return now.getTime() - then <= days * DAY_MS && then <= now.getTime();
}

export function isSameUtcDay(timestamp: string, now: Date): boolean {
  const then = new Date(timestamp);
  if (Number.isNaN(then.getTime())) return false;
  return toDateKey(then) === toDateKey(now);
}
