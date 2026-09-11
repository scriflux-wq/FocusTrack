import { getUser } from "@/lib/supabase/server";
import { getOrCreateSettings, getFinishedEntriesInRange } from "@/lib/db/queries";
import {
  getDayRange,
  getWeekRange,
  getMonthRange,
  formatDayLabel,
  formatInZone,
  toDateISO,
  addZonedDays,
  capToNow,
} from "@/lib/calendar/date-utils";
import { CalendarHeader, type CalendarView } from "@/components/calendar/calendar-header";
import { CalendarGrid, type DayColumn } from "@/components/calendar/calendar-grid";
import { MonthGrid, type MonthDay } from "@/components/calendar/month-grid";
import { WeekSummaryCard } from "@/components/calendar/week-summary-card";
import { AddEventFab } from "@/components/calendar/add-event-fab";
import { MiniMonthCalendar } from "@/components/calendar/mini-month-calendar";
import { DayDetailPanel } from "@/components/calendar/day-detail-panel";
import { QuoteCard } from "@/components/ui/quote-card";
import { getTrackedSeconds, getUntrackedSeconds } from "@/lib/analytics/core";
import type { TimeEntry } from "@/lib/db/schema";

/**
 * Viewport minus the app shell's chrome, so the calendar fills the screen
 * instead of sitting in a short scrollable box. Mobile leaves room for the
 * bottom nav and keeps its scrolling inside the grid body.
 */
const FULL_HEIGHT =
  "h-[calc(100dvh-13rem)] min-h-[24rem] lg:h-[calc(100dvh-9rem)] lg:min-h-[32rem]";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; date?: string }>;
}) {
  const user = await getUser();
  if (!user) return null;

  const settings = await getOrCreateSettings(user.id);
  const params = await searchParams;
  const view = (params.view as CalendarView) ?? settings.defaultCalendarView;
  const referenceDate = params.date ? new Date(params.date + "T12:00:00Z") : new Date();
  const tz = settings.timezone;
  const referenceDateISO = toDateISO(referenceDate, tz);
  const { start: selectedDayStart, end: selectedDayEnd } = getDayRange(referenceDate, tz);

  if (view === "month") {
    const { start: monthStart } = getMonthRange(referenceDate, tz);
    const gridStart = getWeekRange(monthStart, tz, settings.weekStartsOn).start;
    const gridEnd = addZonedDays(gridStart, tz, 42);
    const entries = await getFinishedEntriesInRange(user.id, gridStart, gridEnd);
    const selectedDayEntries = entries.filter(
      (e) => e.startTime >= selectedDayStart && e.startTime < selectedDayEnd,
    );

    const currentMonthLabel = formatInZone(referenceDate, tz, "MMMM yyyy");
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
          entries: entries.filter((e) => e.startTime >= dayStart && e.startTime < dayEnd),
        });
      }
      weeks.push(week);
    }

    return (
      <div className={`flex flex-col gap-4 lg:flex-row lg:gap-6 ${FULL_HEIGHT}`}>
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          <CalendarHeader view={view} dateISO={referenceDateISO} label={currentMonthLabel} />
          <div className="min-h-0 flex-1">
            <MonthGrid weeks={weeks} timezone={tz} />
          </div>
        </div>
        <div className="hidden w-[300px] shrink-0 flex-col gap-4 overflow-y-auto lg:flex">
          <DayDetailPanel
            label={formatDayLabel(referenceDate, tz)}
            entries={selectedDayEntries}
            timezone={tz}
            timeFormat={settings.timeFormat}
          />
          <QuoteCard seed={1} />
        </div>
        <AddEventFab />
      </div>
    );
  }

  const dayCount = view === "day" ? 1 : view === "3day" ? 3 : 7;
  const rangeStart =
    view === "week"
      ? getWeekRange(referenceDate, tz, settings.weekStartsOn).start
      : getDayRange(referenceDate, tz).start;
  const rangeEnd = addZonedDays(rangeStart, tz, dayCount);

  const entries = await getFinishedEntriesInRange(user.id, rangeStart, rangeEnd);

  const days: DayColumn[] = [];
  for (let i = 0; i < dayCount; i++) {
    const dayStart = addZonedDays(rangeStart, tz, i);
    const dayEnd = addZonedDays(dayStart, tz, 1);
    days.push({
      dayStart,
      weekdayNarrow: formatInZone(dayStart, tz, "EEEEE"),
      weekdayShort: formatInZone(dayStart, tz, "EEE"),
      dayNumber: formatInZone(dayStart, tz, "d"),
      entries: entries.filter(
        (e) => e.startTime >= dayStart && e.startTime < dayEnd,
      ) as TimeEntry[],
    });
  }

  const selectedDayEntries = entries.filter(
    (e) => e.startTime >= selectedDayStart && e.startTime < selectedDayEnd,
  );

  const label =
    view === "day"
      ? formatDayLabel(referenceDate, tz)
      : `${formatInZone(rangeStart, tz, "d MMM")} – ${formatInZone(
          new Date(rangeEnd.getTime() - 1),
          tz,
          "d MMM yyyy",
        )}`;

  let weeklyUntrackedSeconds = 0;
  if (view === "week") {
    const now = new Date();
    for (const day of days) {
      const dayEnd = addZonedDays(day.dayStart, tz, 1);
      // "Untracked" spans the whole calendar day (from midnight), capped so
      // it never claims time that hasn't happened yet.
      weeklyUntrackedSeconds += getUntrackedSeconds(
        day.entries,
        day.dayStart,
        capToNow(dayEnd, now),
      );
    }
  }

  return (
    <div className={`flex flex-col gap-4 lg:flex-row lg:gap-6 ${FULL_HEIGHT}`}>
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <CalendarHeader view={view} dateISO={referenceDateISO} label={label} />
        <div className="min-h-0 flex-1">
          <CalendarGrid days={days} timezone={tz} timeFormat={settings.timeFormat} />
        </div>
        {view === "week" && (
          <WeekSummaryCard
            trackedSeconds={getTrackedSeconds(entries)}
            untrackedSeconds={weeklyUntrackedSeconds}
          />
        )}
      </div>

      <div className="hidden w-[300px] shrink-0 flex-col gap-4 overflow-y-auto lg:flex">
        <MiniMonthCalendar
          referenceDateISO={referenceDateISO}
          weekStartsOn={settings.weekStartsOn}
        />
        <DayDetailPanel
          label={formatDayLabel(referenceDate, tz)}
          entries={selectedDayEntries}
          timezone={tz}
          timeFormat={settings.timeFormat}
        />
        <QuoteCard seed={2} />
      </div>

      <AddEventFab />
    </div>
  );
}
