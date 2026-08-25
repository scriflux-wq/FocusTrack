import Link from "next/link";
import { Search } from "lucide-react";
import { getUser } from "@/lib/supabase/server";
import {
  getFinishedEntriesInRange,
  getOrCreateSettings,
  getRecentActivities,
  getCategories,
} from "@/lib/db/queries";
import { getDayRange, formatDayLabel, capToNow } from "@/lib/calendar/date-utils";
import {
  getTrackedSeconds,
  getTimeByCategory,
  getUntrackedRanges,
  getUntrackedSeconds,
} from "@/lib/analytics/core";
import { HeroCard } from "@/components/today/hero-card";
import { QuickActionsRow } from "@/components/today/quick-actions-row";
import { QuickStartBar } from "@/components/entries/quick-start-bar";
import { AgendaList } from "@/components/today/agenda-list";
import { CategorySummary } from "@/components/today/category-summary";
import { UntrackedBanner } from "@/components/today/untracked-banner";
import { NotificationsButton } from "@/components/today/notifications-button";

export default async function TodayPage() {
  const user = await getUser();
  if (!user) return null;

  const [settings, categories] = await Promise.all([
    getOrCreateSettings(user.id),
    getCategories(user.id),
  ]);

  const now = new Date();
  const { start, end } = getDayRange(now, settings.timezone);
  const [entries, recent] = await Promise.all([
    getFinishedEntriesInRange(user.id, start, end),
    getRecentActivities(user.id),
  ]);

  const trackedSeconds = getTrackedSeconds(entries);
  const categoryMap = new Map(categories.map((c) => [c.id, { name: c.name, color: c.color }]));
  const categoryTotals = getTimeByCategory(entries, categoryMap);

  const windowStart = clampToToday(start, settings.dayStartTime, settings.timezone);
  // Never claim time that hasn't happened yet is "untracked".
  const windowEnd = capToNow(clampToToday(start, settings.dayEndTime, settings.timezone), now);
  const gaps = getUntrackedRanges(entries, windowStart, windowEnd);
  const untrackedSeconds = getUntrackedSeconds(entries, windowStart, windowEnd);

  const hour = Number(
    now.toLocaleString("en-US", { timeZone: settings.timezone, hour: "2-digit", hour12: false }),
  );
  const greeting = hour < 12 ? "Buenos días" : hour < 20 ? "Buenas tardes" : "Buenas noches";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm capitalize text-muted-foreground">
            {formatDayLabel(now, settings.timezone)}
          </p>
          <h1 className="text-2xl font-semibold">{greeting} 👋</h1>
          <p className="text-sm text-muted-foreground">Vamos a aprovechar el día.</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/history"
            className="flex size-10 items-center justify-center rounded-full border border-border bg-card hover:bg-secondary"
            aria-label="Buscar"
          >
            <Search className="size-4" />
          </Link>
          <NotificationsButton />
        </div>
      </div>

      <HeroCard trackedTodaySeconds={trackedSeconds} />

      <QuickActionsRow />

      <QuickStartBar recent={recent} />

      <UntrackedBanner
        gaps={gaps}
        totalSeconds={untrackedSeconds}
        timezone={settings.timezone}
        timeFormat={settings.timeFormat}
      />

      <div>
        <div className="mb-2.5 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Today&apos;s Plan</h2>
          <Link
            href="/calendar?view=day"
            className="rounded-full border border-border px-3 py-1 text-xs font-medium hover:bg-secondary"
          >
            See full day
          </Link>
        </div>
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
