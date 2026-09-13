import { Suspense } from "react";
import { getUser } from "@/lib/supabase/server";
import { getOrCreateSettings } from "@/lib/db/queries";
import {
  getDayRange,
  getWeekRange,
  formatDayLabel,
  formatInZone,
  toDateISO,
  addZonedDays,
} from "@/lib/calendar/date-utils";
import { CalendarHeader, type CalendarView } from "@/components/calendar/calendar-header";
import {
  CalendarTransitionProvider,
  CalendarPendingFade,
} from "@/components/calendar/calendar-transition";
import { CalendarGridSection } from "@/components/calendar/calendar-grid-section";
import { DayDetailSection } from "@/components/calendar/day-detail-section";
import {
  CalendarGridSkeleton,
  DayDetailSkeleton,
} from "@/components/calendar/calendar-skeletons";
import { AddEventFab } from "@/components/calendar/add-event-fab";
import { MiniMonthCalendar } from "@/components/calendar/mini-month-calendar";

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

  // Only what the header and mini-calendar need to render — the entries
  // query lives entirely inside CalendarGridSection/DayDetailSection below,
  // so this part resolves fast and never blocks on it.
  const settings = await getOrCreateSettings(user.id);
  const params = await searchParams;
  const view = (params.view as CalendarView) ?? settings.defaultCalendarView;
  const referenceDate = params.date ? new Date(params.date + "T12:00:00Z") : new Date();
  const tz = settings.timezone;
  const referenceDateISO = toDateISO(referenceDate, tz);

  const label =
    view === "month"
      ? formatInZone(referenceDate, tz, "MMMM yyyy")
      : view === "day"
        ? formatDayLabel(referenceDate, tz)
        : rangeLabel(view, referenceDate, tz, settings.weekStartsOn);

  return (
    <CalendarTransitionProvider>
      <div className={`flex flex-col gap-4 lg:flex-row lg:gap-6 ${FULL_HEIGHT}`}>
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          <CalendarHeader view={view} dateISO={referenceDateISO} label={label} />
          <CalendarPendingFade className="flex min-h-0 flex-1 flex-col gap-3">
            <Suspense fallback={<CalendarGridSkeleton view={view} />}>
              <CalendarGridSection
                userId={user.id}
                view={view}
                referenceDate={referenceDate}
                tz={tz}
                weekStartsOn={settings.weekStartsOn}
                timeFormat={settings.timeFormat}
              />
            </Suspense>
          </CalendarPendingFade>
        </div>

        <div className="hidden w-[300px] shrink-0 flex-col gap-4 overflow-y-auto lg:flex">
          {view !== "month" && (
            <MiniMonthCalendar
              referenceDateISO={referenceDateISO}
              weekStartsOn={settings.weekStartsOn}
            />
          )}
          <CalendarPendingFade className="flex flex-col gap-4">
            <Suspense fallback={<DayDetailSkeleton />}>
              <DayDetailSection
                userId={user.id}
                referenceDate={referenceDate}
                tz={tz}
                timeFormat={settings.timeFormat}
                quoteSeed={view === "month" ? 1 : 2}
              />
            </Suspense>
          </CalendarPendingFade>
        </div>

        <AddEventFab />
      </div>
    </CalendarTransitionProvider>
  );
}

function rangeLabel(
  view: CalendarView,
  referenceDate: Date,
  tz: string,
  weekStartsOn: number,
): string {
  const dayCount = view === "3day" ? 3 : 7;
  const rangeStart =
    view === "week"
      ? getWeekRange(referenceDate, tz, weekStartsOn).start
      : getDayRange(referenceDate, tz).start;
  const rangeEnd = addZonedDays(rangeStart, tz, dayCount);
  return `${formatInZone(rangeStart, tz, "d MMM")} – ${formatInZone(
    new Date(rangeEnd.getTime() - 1),
    tz,
    "d MMM yyyy",
  )}`;
}
