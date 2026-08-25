import { getUser } from "@/lib/supabase/server";
import {
  getFinishedEntriesInRange,
  getOverallDailyGoalMinutes,
  getOrCreateSettings,
  getRecentActivities,
  getCategories,
} from "@/lib/db/queries";
import { getDayRange, formatDayLabel } from "@/lib/calendar/date-utils";
import {
  getTrackedSeconds,
  getTimeByCategory,
  getUntrackedRanges,
  getUntrackedSeconds,
} from "@/lib/analytics/core";
import { HeroCard } from "@/components/today/hero-card";
import { QuickStartBar } from "@/components/entries/quick-start-bar";
import { AgendaList } from "@/components/today/agenda-list";
import { CategorySummary } from "@/components/today/category-summary";
import { UntrackedBanner } from "@/components/today/untracked-banner";

export default async function TodayPage() {
  const user = await getUser();
  if (!user) return null;

  const [settings, categories] = await Promise.all([
    getOrCreateSettings(user.id),
    getCategories(user.id),
  ]);

  const now = new Date();
  const { start, end } = getDayRange(now, settings.timezone);
  const [entries, dailyGoalMinutes, recent] = await Promise.all([
    getFinishedEntriesInRange(user.id, start, end),
    getOverallDailyGoalMinutes(user.id),
    getRecentActivities(user.id),
  ]);

  const trackedSeconds = getTrackedSeconds(entries);
  const categoryMap = new Map(categories.map((c) => [c.id, { name: c.name, color: c.color }]));
  const categoryTotals = getTimeByCategory(entries, categoryMap);

  const windowStart = clampToToday(start, settings.dayStartTime, settings.timezone);
  const windowEnd = clampToToday(start, settings.dayEndTime, settings.timezone);
  const gaps = getUntrackedRanges(entries, windowStart, windowEnd);
  const untrackedSeconds = getUntrackedSeconds(entries, windowStart, windowEnd);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm capitalize text-muted-foreground">
          {formatDayLabel(now, settings.timezone)}
        </p>
        <h1 className="text-2xl font-semibold">¡Buenos días! 👋</h1>
        <p className="text-sm text-muted-foreground">Vamos a aprovechar el día.</p>
      </div>

      <HeroCard trackedTodaySeconds={trackedSeconds} dailyGoalMinutes={dailyGoalMinutes} />

      <QuickStartBar recent={recent} />

      <UntrackedBanner
        gaps={gaps}
        totalSeconds={untrackedSeconds}
        timezone={settings.timezone}
        timeFormat={settings.timeFormat}
      />

      <div>
        <h2 className="mb-2.5 text-sm font-medium text-muted-foreground">
          Agenda de hoy
        </h2>
        <AgendaList
          entries={entries}
          timezone={settings.timezone}
          timeFormat={settings.timeFormat}
        />
      </div>

      <CategorySummary totals={categoryTotals} />
    </div>
  );
}

/** Combines today's date (from `dayStart`) with a "HH:mm" wall-clock time in `tz`. */
function clampToToday(dayStart: Date, hhmm: string, tz: string): Date {
  const [h, m] = hhmm.split(":").map(Number);
  const local = new Date(dayStart);
  // dayStart is midnight (00:00) local-time-as-UTC-instant for `tz`; add the offset directly.
  return new Date(local.getTime() + (h * 60 + m) * 60 * 1000);
}
