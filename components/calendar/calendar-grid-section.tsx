import { getFinishedEntriesInRange } from "@/lib/db/queries";
import {
  getDayRange,
  getWeekRange,
  getMonthRange,
  formatInZone,
  toDateISO,
  addZonedDays,
  capToNow,
} from "@/lib/calendar/date-utils";
import { CalendarGrid, type DayColumn, type DaySegment } from "./calendar-grid";
import { MonthGrid, type MonthDay } from "./month-grid";
import { WeekSummaryCard } from "./week-summary-card";
import { getTrackedSeconds, getUntrackedSeconds, clipToWindow } from "@/lib/analytics/core";
import type { CalendarView } from "./calendar-header";
import type { TimeEntry } from "@/lib/db/schema";

/** Entries touching [dayStart, dayEnd), regardless of which day they started on. */
function overlapping(entries: TimeEntry[], dayStart: Date, dayEnd: Date) {
  return entries.filter((e) => e.startTime < dayEnd && (e.endTime ?? dayEnd) > dayStart);
}

/** Clips each overlapping entry to the day, remembering whether it runs past either edge. */
function segmentsFor(entries: TimeEntry[], dayStart: Date, dayEnd: Date): DaySegment[] {
  return overlapping(entries, dayStart, dayEnd).map((entry) => {
    const end = entry.endTime ?? dayEnd;
    return {
      entry,
      start: entry.startTime > dayStart ? entry.startTime : dayStart,
      end: end < dayEnd ? end : dayEnd,
      continuesBefore: entry.startTime < dayStart,
      continuesAfter: end > dayEnd,
    };
  });
}

/**
 * The only part of the calendar page that actually needs the entries query.
 * Rendered inside a `<Suspense>` in page.tsx so the header and mini-calendar
 * (computed from settings alone) never wait on it.
 */
export async function CalendarGridSection({
  userId,
  view,
  referenceDate,
  tz,
  weekStartsOn,
  timeFormat,
}: {
  userId: string;
  view: CalendarView;
  referenceDate: Date;
  tz: string;
  weekStartsOn: number;
  timeFormat: string;
}) {
  if (view === "month") {
    const { start: monthStart } = getMonthRange(referenceDate, tz);
    const gridStart = getWeekRange(monthStart, tz, weekStartsOn).start;
    const gridEnd = addZonedDays(gridStart, tz, 42);
    const entries = await getFinishedEntriesInRange(userId, gridStart, gridEnd);

    const currentMonthKey = formatInZone(referenceDate, tz, "yyyy-MM");
    const todayStart = getDayRange(new Date(), tz).start;

    const weeks: MonthDay[][] = [];
    for (let w = 0; w < 6; w++) {
      const week: MonthDay[] = [];
      for (let d = 0; d < 7; d++) {
        const dayStart = addZonedDays(gridStart, tz, w * 7 + d);
        const dayEnd = addZonedDays(dayStart, tz, 1);
        week.push({
          dayStart,
          dateISO: toDateISO(dayStart, tz),
          dayNumber: Number(formatInZone(dayStart, tz, "d")),
          inCurrentMonth: formatInZone(dayStart, tz, "yyyy-MM") === currentMonthKey,
          isToday: dayStart.getTime() === todayStart.getTime(),
          entries: overlapping(entries, dayStart, dayEnd),
        });
      }
      weeks.push(week);
    }

    return <MonthGrid weeks={weeks} timezone={tz} />;
  }

  const dayCount = view === "day" ? 1 : view === "3day" ? 3 : 7;
  const rangeStart =
    view === "week"
      ? getWeekRange(referenceDate, tz, weekStartsOn).start
      : getDayRange(referenceDate, tz).start;
  const rangeEnd = addZonedDays(rangeStart, tz, dayCount);
  const entries = await getFinishedEntriesInRange(userId, rangeStart, rangeEnd);

  const days: DayColumn[] = [];
  for (let i = 0; i < dayCount; i++) {
    const dayStart = addZonedDays(rangeStart, tz, i);
    const dayEnd = addZonedDays(dayStart, tz, 1);
    days.push({
      dayStart,
      weekdayNarrow: formatInZone(dayStart, tz, "EEEEE"),
      weekdayShort: formatInZone(dayStart, tz, "EEE"),
      dayNumber: formatInZone(dayStart, tz, "d"),
      segments: segmentsFor(entries, dayStart, dayEnd),
    });
  }

  let weeklyUntrackedSeconds = 0;
  if (view === "week") {
    const now = new Date();
    for (const day of days) {
      const dayEnd = addZonedDays(day.dayStart, tz, 1);
      // "Untracked" spans the whole calendar day (from midnight), capped so
      // it never claims time that hasn't happened yet.
      weeklyUntrackedSeconds += getUntrackedSeconds(entries, day.dayStart, capToNow(dayEnd, now));
    }
  }

  return (
    <>
      <div className="min-h-0 flex-1">
        <CalendarGrid days={days} timezone={tz} timeFormat={timeFormat} />
      </div>
      {view === "week" && (
        <WeekSummaryCard
          trackedSeconds={getTrackedSeconds(clipToWindow(entries, rangeStart, rangeEnd))}
          untrackedSeconds={weeklyUntrackedSeconds}
        />
      )}
    </>
  );
}
