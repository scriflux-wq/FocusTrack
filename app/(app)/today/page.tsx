import Link from "next/link";
import { Sparkle } from "lucide-react";
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
import { GapReviewController } from "@/components/today/gap-review-controller";
import { QuickStartBar } from "@/components/entries/quick-start-bar";
import { AgendaList } from "@/components/today/agenda-list";
import { CategorySummary } from "@/components/today/category-summary";
import { QuickNoteCard } from "@/components/today/quick-note-card";
import { QuoteCard } from "@/components/ui/quote-card";

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

  // "Untracked" spans the whole calendar day (from midnight), capped so it
  // never claims time that hasn't happened yet.
  const windowEnd = capToNow(end, now);
  const gaps = getUntrackedRanges(entries, start, windowEnd);
  const untrackedSeconds = getUntrackedSeconds(entries, start, windowEnd);

  const hour = Number(
    now.toLocaleString("en-US", { timeZone: settings.timezone, hour: "2-digit", hour12: false }),
  );
  const greeting = hour < 12 ? "Buenos días" : hour < 20 ? "Buenas tardes" : "Buenas noches";
  const firstName = (user.email ?? "").split("@")[0];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
      <div className="flex flex-col gap-6">
        <div>
          <p className="text-sm capitalize text-muted-foreground">
            {formatDayLabel(now, settings.timezone)}
          </p>
          <h1 className="flex items-center gap-2 font-serif text-2xl font-semibold">
            {greeting}, {firstName}
            <span aria-hidden>👋</span>
          </h1>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Sparkle className="size-3.5" />
            Vamos a aprovechar el día.
          </p>
        </div>

        <HeroCard trackedTodaySeconds={trackedSeconds} />

        <GapReviewController
          gaps={gaps}
          totalSeconds={untrackedSeconds}
          timezone={settings.timezone}
          timeFormat={settings.timeFormat}
        />

        <QuickStartBar recent={recent} />

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

      <div className="hidden flex-col gap-4 lg:flex">
        <QuickNoteCard />
        <QuoteCard seed={0} />
      </div>
    </div>
  );
}
