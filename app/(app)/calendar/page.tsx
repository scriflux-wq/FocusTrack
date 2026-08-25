import { getUser } from "@/lib/supabase/server";
import { getOrCreateSettings, getFinishedEntriesInRange } from "@/lib/db/queries";
import {
  getDayRange,
  getWeekRange,
  getMonthRange,
  formatDayLabel,
} from "@/lib/calendar/date-utils";
import { CalendarHeader, type CalendarView } from "@/components/calendar/calendar-header";
import { CalendarGrid, type DayColumn } from "@/components/calendar/calendar-grid";
import { MonthGrid, type MonthDay } from "@/components/calendar/month-grid";
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
  const tz = settings.timezone;
  const [startHour] = settings.dayStartTime.split(":").map(Number);
  const [endHour] = settings.dayEndTime.split(":").map(Number);

  if (view === "month") {
    const { start } = getMonthRange(referenceDate, tz);
    const monthStart = new Date(referenceDate);
    const gridStart = getWeekRange(start, tz, settings.weekStartsOn).start;
    const gridEnd = new Date(gridStart.getTime() + 42 * 24 * 60 * 60 * 1000);
    const entries = await getFinishedEntriesInRange(user.id, gridStart, gridEnd);

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
      <div className="flex flex-col gap-4">
        <CalendarHeader
          view={view}
          dateISO={referenceDate.toISOString().slice(0, 10)}
          label={currentMonthLabel}
        />
        <MonthGrid weeks={weeks} />
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

  const label =
    view === "day"
      ? formatDayLabel(referenceDate, tz)
      : `${formatTz(rangeStart, "d MMM", { timeZone: tz, locale: es })} – ${formatTz(
          new Date(rangeEnd.getTime() - 1),
          "d MMM yyyy",
          { timeZone: tz, locale: es },
        )}`;

  return (
    <div className="flex flex-col gap-4">
      <CalendarHeader
        view={view}
        dateISO={referenceDate.toISOString().slice(0, 10)}
        label={label}
      />
      <div className="overflow-x-auto">
        <div style={{ minWidth: dayCount > 1 ? 640 : undefined }}>
          <CalendarGrid
            days={days}
            dayStartHour={startHour}
            dayEndHour={endHour}
            timezone={tz}
            timeFormat={settings.timeFormat}
          />
        </div>
      </div>
    </div>
  );
}
