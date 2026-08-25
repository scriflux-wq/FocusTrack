import { format as formatTz } from "date-fns-tz";
import { es } from "date-fns/locale";
import { getUser } from "@/lib/supabase/server";
import { getOrCreateSettings, getFinishedEntriesInRange } from "@/lib/db/queries";
import { getDayRange, getWeekRange, getMonthRange } from "@/lib/calendar/date-utils";
import {
  getTrackedSeconds,
  getPeriodComparison,
  getMostProductiveDay,
  getLongestStreak,
  getUntrackedSeconds,
} from "@/lib/analytics/core";
import { InsightsView, type Period } from "@/components/insights/insights-view";
import type { TimeEntry } from "@/lib/db/schema";

const DAY_MS = 24 * 60 * 60 * 1000;

export default async function InsightsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const user = await getUser();
  if (!user) return null;

  const settings = await getOrCreateSettings(user.id);
  const tz = settings.timezone;
  const params = await searchParams;
  const period = (params.period as Period) ?? "week";
  const now = new Date();

  const { start, end } =
    period === "today"
      ? getDayRange(now, tz)
      : period === "week"
        ? getWeekRange(now, tz, settings.weekStartsOn)
        : period === "month"
          ? getMonthRange(now, tz)
          : { start: getMonthRange(new Date(now.getFullYear(), 0, 1), tz).start, end: getMonthRange(new Date(now.getFullYear(), 11, 1), tz).end };

  const durationMs = end.getTime() - start.getTime();
  const previousStart = new Date(start.getTime() - durationMs);
  const previousEnd = start;

  const [entries, previousEntries] = await Promise.all([
    getFinishedEntriesInRange(user.id, start, end),
    getFinishedEntriesInRange(user.id, previousStart, previousEnd),
  ]);

  const total = getTrackedSeconds(toAnalytics(entries));
  const previousTotal = getTrackedSeconds(toAnalytics(previousEntries));
  const comparison = getPeriodComparison(total, previousTotal);

  const buckets = buildBuckets(period, start, end, tz);
  const dailyTotals = buckets.map((b) => ({
    day: b.label,
    seconds: getTrackedSeconds(
      toAnalytics(entries.filter((e) => e.startTime >= b.start && e.startTime < b.end)),
    ),
  }));
  const mostProductiveDay = getMostProductiveDay(dailyTotals);

  // Untracked time is computed per real calendar day (needs the dayStart/dayEnd
  // window); skipped for "year" to avoid 365 per-day gap calculations.
  let untrackedSeconds = 0;
  if (period !== "year") {
    const dayMsStart = getDayRange(start, tz).start;
    for (let cursor = dayMsStart; cursor < end; cursor = new Date(cursor.getTime() + DAY_MS)) {
      const dayEntries = entries.filter(
        (e) => e.startTime >= cursor && e.startTime < new Date(cursor.getTime() + DAY_MS),
      );
      const [sh, sm] = settings.dayStartTime.split(":").map(Number);
      const [eh, em] = settings.dayEndTime.split(":").map(Number);
      const windowStart = new Date(cursor.getTime() + (sh * 60 + sm) * 60000);
      const windowEnd = new Date(cursor.getTime() + (eh * 60 + em) * 60000);
      untrackedSeconds += getUntrackedSeconds(toAnalytics(dayEntries), windowStart, windowEnd);
    }
  }

  // Streak over the trailing 60 real calendar days, regardless of the selected period.
  const streakEnd = getDayRange(now, tz).end;
  const streakStart = new Date(streakEnd.getTime() - 60 * DAY_MS);
  const streakEntries = await getFinishedEntriesInRange(user.id, streakStart, streakEnd);
  const streakDays: { seconds: number }[] = [];
  for (let cursor = streakStart; cursor < streakEnd; cursor = new Date(cursor.getTime() + DAY_MS)) {
    const dayEntries = streakEntries.filter(
      (e) => e.startTime >= cursor && e.startTime < new Date(cursor.getTime() + DAY_MS),
    );
    streakDays.push({ seconds: getTrackedSeconds(toAnalytics(dayEntries)) });
  }
  const streak = getLongestStreak(streakDays);

  return (
    <InsightsView
      period={period}
      entries={toAnalytics(entries)}
      dailyTotals={dailyTotals}
      comparisonPercent={comparison.percent}
      mostProductiveDay={mostProductiveDay}
      streak={streak}
      untrackedSeconds={untrackedSeconds}
    />
  );
}

function toAnalytics(entries: TimeEntry[]) {
  return entries.map((e) => ({
    id: e.id,
    title: e.title,
    startTime: e.startTime,
    endTime: e.endTime,
    durationSeconds: e.durationSeconds,
    categoryId: e.categoryId,
    projectId: e.projectId,
  }));
}

function buildBuckets(period: Period, start: Date, end: Date, tz: string) {
  const buckets: { start: Date; end: Date; label: string }[] = [];
  if (period === "year") {
    let cursor = new Date(start);
    while (cursor < end) {
      const next = new Date(cursor);
      next.setUTCMonth(next.getUTCMonth() + 1);
      buckets.push({
        start: cursor,
        end: next,
        label: formatTz(cursor, "MMM", { timeZone: tz, locale: es }),
      });
      cursor = next;
    }
  } else {
    for (let cursor = new Date(start); cursor < end; cursor = new Date(cursor.getTime() + DAY_MS)) {
      buckets.push({
        start: cursor,
        end: new Date(cursor.getTime() + DAY_MS),
        label: formatTz(cursor, period === "month" ? "d" : "EEE", { timeZone: tz, locale: es }),
      });
    }
  }
  return buckets;
}
