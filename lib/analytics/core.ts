/**
 * Pure analytics functions. They take already-range-filtered entry arrays
 * (fetched from the DB by the caller) and derive numbers/groupings — no
 * DB access, no React, so they're trivially unit-testable.
 */

export type AnalyticsEntry = {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date | null;
  durationSeconds: number | null;
  categoryId: string | null;
  projectId: string | null;
};

function seconds(e: AnalyticsEntry): number {
  return e.durationSeconds ?? 0;
}

export function getTrackedSeconds(entries: AnalyticsEntry[]): number {
  return entries.reduce((sum, e) => sum + seconds(e), 0);
}

export type GroupTotal = { key: string; label: string; seconds: number; color?: string };

/** Groups entries by an arbitrary key (category id, project id, or title). */
export function groupBySeconds(
  entries: AnalyticsEntry[],
  keyFn: (e: AnalyticsEntry) => string,
  labelFn: (key: string) => string,
  colorFn?: (key: string) => string | undefined,
): GroupTotal[] {
  const totals = new Map<string, number>();
  for (const e of entries) {
    const key = keyFn(e);
    totals.set(key, (totals.get(key) ?? 0) + seconds(e));
  }
  return [...totals.entries()]
    .map(([key, secs]) => ({
      key,
      label: labelFn(key),
      seconds: secs,
      color: colorFn?.(key),
    }))
    .sort((a, b) => b.seconds - a.seconds);
}

export function getTimeByCategory(
  entries: AnalyticsEntry[],
  categoryNames: Map<string, { name: string; color: string }>,
): GroupTotal[] {
  return groupBySeconds(
    entries,
    (e) => e.categoryId ?? "none",
    (key) => (key === "none" ? "Sin categoría" : (categoryNames.get(key)?.name ?? "—")),
    (key) => (key === "none" ? "cat-free" : categoryNames.get(key)?.color),
  );
}

export function getTimeByActivity(entries: AnalyticsEntry[]): GroupTotal[] {
  return groupBySeconds(
    entries,
    (e) => e.title,
    (key) => key,
  );
}

/** Days with zero tracked time (per local calendar day) between start and end. */
export function getDailyTotals(
  entries: AnalyticsEntry[],
  dayKeyFn: (date: Date) => string,
  days: string[],
): { day: string; seconds: number }[] {
  const totals = new Map<string, number>();
  for (const e of entries) {
    const key = dayKeyFn(e.startTime);
    totals.set(key, (totals.get(key) ?? 0) + seconds(e));
  }
  return days.map((day) => ({ day, seconds: totals.get(day) ?? 0 }));
}

export function getAveragePerDay(totalSeconds: number, dayCount: number): number {
  if (dayCount <= 0) return 0;
  return totalSeconds / dayCount;
}

export function getAveragePerActiveDay(dailyTotals: { seconds: number }[]): number {
  const active = dailyTotals.filter((d) => d.seconds > 0);
  if (active.length === 0) return 0;
  return active.reduce((sum, d) => sum + d.seconds, 0) / active.length;
}

export function getMostProductiveDay(
  dailyTotals: { day: string; seconds: number }[],
): { day: string; seconds: number } | null {
  if (dailyTotals.length === 0) return null;
  return dailyTotals.reduce((best, d) => (d.seconds > best.seconds ? d : best));
}

/** Longest run of consecutive days (ending at or before today) with tracked time > 0. */
export function getLongestStreak(
  dailyTotalsChronological: { seconds: number }[],
): number {
  let longest = 0;
  let current = 0;
  for (const d of dailyTotalsChronological) {
    if (d.seconds > 0) {
      current += 1;
      longest = Math.max(longest, current);
    } else {
      current = 0;
    }
  }
  return longest;
}

export function getPeriodComparison(
  currentSeconds: number,
  previousSeconds: number,
): { deltaSeconds: number; percent: number | null } {
  const deltaSeconds = currentSeconds - previousSeconds;
  if (previousSeconds === 0) return { deltaSeconds, percent: null };
  return { deltaSeconds, percent: (deltaSeconds / previousSeconds) * 100 };
}

/** Gaps within [dayStart, dayEnd) not covered by any entry — "untracked time". */
export function getUntrackedRanges(
  entries: AnalyticsEntry[],
  dayStart: Date,
  dayEnd: Date,
): { start: Date; end: Date }[] {
  const covered = entries
    .filter((e) => e.endTime)
    .map((e) => ({
      start: e.startTime < dayStart ? dayStart : e.startTime,
      end: (e.endTime as Date) > dayEnd ? dayEnd : (e.endTime as Date),
    }))
    .filter((r) => r.end > r.start)
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  const merged: { start: Date; end: Date }[] = [];
  for (const r of covered) {
    const last = merged[merged.length - 1];
    if (last && r.start <= last.end) {
      last.end = r.end > last.end ? r.end : last.end;
    } else {
      merged.push({ ...r });
    }
  }

  const gaps: { start: Date; end: Date }[] = [];
  let cursor = dayStart;
  for (const r of merged) {
    if (r.start > cursor) gaps.push({ start: cursor, end: r.start });
    cursor = r.end > cursor ? r.end : cursor;
  }
  if (cursor < dayEnd) gaps.push({ start: cursor, end: dayEnd });

  return gaps;
}

export function getUntrackedSeconds(
  entries: AnalyticsEntry[],
  dayStart: Date,
  dayEnd: Date,
): number {
  return getUntrackedRanges(entries, dayStart, dayEnd).reduce(
    (sum, g) => sum + (g.end.getTime() - g.start.getTime()) / 1000,
    0,
  );
}
