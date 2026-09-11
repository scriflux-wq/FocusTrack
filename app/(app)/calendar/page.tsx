import { getUser } from "@/lib/supabase/server";
import { getOrCreateSettings, getFinishedEntriesInRange } from "@/lib/db/queries";
import {
  getDayRange,
  getWeekRange,
  getMonthRange,
  formatDayLabel,
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
import { format as formatTz } from "date-fns-tz";
import { es } from "date-fns/locale";
import type { TimeEntry } from "@/lib/db/schema";

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
  const referenceDateISO = referenceDate.toISOString().slice(0, 10);
  const tz = settings.timezone;
  const { start: selectedDayStart, end: selectedDayEnd } = getDayRange(referenceDate, tz);

  if (view === "month") {
    const { start } = getMonthRange(referenceDate, tz);
    const monthStart = new Date(referenceDate);
    const gridStart = getWeekRange(start, tz, settings.weekStartsOn).start;
    const gridEnd = new Date(gridStart.getTime() + 42 * 24 * 60 * 60 * 1000);
    const entries = await getFinishedEntriesInRange(user.id, gridStart, gridEnd);
    const selectedDayEntries = entries.filter(
      (e) => e.startTime >= selectedDayStart && e.startTime < selectedDayEnd,
    );

    const currentMonthLabel = formatTz(referenceDate, "MMMM yyyy", { timeZone: tz, locale: es });
    const todayStart = getDayRange(new Date(), tz).start;

    const weeks: MonthDay[][] = [];
    for (let w = 0; w < 6; w++) {
      const week: MonthDay[] = [];
      for (let d = 0; d < 7; d++) {
        const dayStart = new Date(gridStart.getTime() + (w * 7 + d) * 24 * 60 * 60 * 1000);
        const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
        const dayEntries = entries.filter(
          (e) => e.startTime >= dayStart && e.startTime < dayEnd,
        );
        week.push({
          dayStart,
          dateISO: dayStart.toISOString().slice(0, 10),
          dayNumber: Number(
            formatTz(dayStart, "d", { timeZone: tz }),
          ),
          inCurrentMonth:
            formatTz(dayStart, "yyyy-MM", { timeZone: tz }) ===
            formatTz(monthStart, "yyyy-MM", { timeZone: tz }),
          isToday: dayStart.getTime() === todayStart.getTime(),
          entries: dayEntries,
        });
      }
      weeks.push(week);
    }

    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
        <div className="flex flex-col gap-4">
          <CalendarHeader
            view={view}
            dateISO={referenceDateISO}
            label={currentMonthLabel}
          />
          <MonthGrid weeks={weeks} timezone={tz} />
        </div>
        <div className="hidden flex-col gap-4 lg:flex">
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

  const days: DayColumn[] = [];
  for (let i = 0; i < dayCount; i++) {
    const dayStart = new Date(rangeStart.getTime() + i * 24 * 60 * 60 * 1000);
    days.push({
      dayStart,
      dateLabel: formatTz(dayStart, "EEE d", { timeZone: tz, locale: es }),
      entries: [] as TimeEntry[],
    });
  }
  const rangeEnd = new Date(rangeStart.getTime() + dayCount * 24 * 60 * 60 * 1000);
  const entries = await getFinishedEntriesInRange(user.id, rangeStart, rangeEnd);
  for (const entry of entries) {
    const col = days.find(
      (d) =>
        entry.startTime >= d.dayStart &&
        entry.startTime < new Date(d.dayStart.getTime() + 24 * 60 * 60 * 1000),
    );
    if (col) col.entries.push(entry);
  }
  const selectedDayEntries = entries.filter(
    (e) => e.startTime >= selectedDayStart && e.startTime < selectedDayEnd,
  );

  const label =
    view === "day"
      ? formatDayLabel(referenceDate, tz)
      : `${formatTz(rangeStart, "d MMM", { timeZone: tz, locale: es })} – ${formatTz(
          new Date(rangeEnd.getTime() - 1),
          "d MMM yyyy",
          { timeZone: tz, locale: es },
        )}`;

  let weeklyUntrackedSeconds = 0;
  if (view === "week") {
    const now = new Date();
    for (const day of days) {
      const dayEnd = new Date(day.dayStart.getTime() + 24 * 60 * 60 * 1000);
      // "Untracked" spans the whole calendar day (from midnight), capped so
      // it never claims time that hasn't happened yet.
      const windowEnd = capToNow(dayEnd, now);
      weeklyUntrackedSeconds += getUntrackedSeconds(day.entries, day.dayStart, windowEnd);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
      <div className="flex flex-col gap-4">
        <CalendarHeader view={view} dateISO={referenceDateISO} label={label} />
        <div className="overflow-x-auto">
          <div style={{ minWidth: dayCount > 1 ? 640 : undefined }}>
            <CalendarGrid
              days={days}
              dayStartHour={0}
              dayEndHour={24}
              timezone={tz}
              timeFormat={settings.timeFormat}
            />
          </div>
        </div>

        {view === "week" && (
          <WeekSummaryCard
            trackedSeconds={getTrackedSeconds(entries)}
            untrackedSeconds={weeklyUntrackedSeconds}
          />
        )}
      </div>

      <div className="hidden flex-col gap-4 lg:flex">
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
