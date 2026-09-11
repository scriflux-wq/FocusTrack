import { getUser } from "@/lib/supabase/server";
import {
  getRecentEntries,
  getOrCreateSettings,
  getFinishedEntriesInRange,
  getCategories,
} from "@/lib/db/queries";
import { getDayRange } from "@/lib/calendar/date-utils";
import { getTrackedSeconds, getTimeByCategory } from "@/lib/analytics/core";
import { HistoryView } from "@/components/history/history-view";
import { DonutChart } from "@/components/charts/donut-chart";
import { QuoteCard } from "@/components/ui/quote-card";
import { formatDurationShort } from "@/lib/timer/timer-engine";

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await getUser();
  if (!user) return null;

  const params = await searchParams;
  const [entries, settings, categories] = await Promise.all([
    getRecentEntries(user.id),
    getOrCreateSettings(user.id),
    getCategories(user.id),
  ]);

  const { start, end } = getDayRange(new Date(), settings.timezone);
  const todayEntries = await getFinishedEntriesInRange(user.id, start, end);
  const categoryMap = new Map(categories.map((c) => [c.id, { name: c.name, color: c.color }]));
  const todayByCategory = getTimeByCategory(todayEntries, categoryMap);
  const todayTotal = getTrackedSeconds(todayEntries);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
      <HistoryView
        entries={entries}
        timezone={settings.timezone}
        timeFormat={settings.timeFormat}
        initialQuery={params.q ?? ""}
      />

      <div className="hidden flex-col gap-4 lg:flex">
        <div className="rounded-3xl border border-border bg-card p-4">
          <p className="mb-3 text-sm font-semibold">Today&apos;s Summary</p>
          {todayTotal > 0 ? (
            <>
              <DonutChart data={todayByCategory} />
              <p className="mt-2 text-center text-xs text-muted-foreground">
                {formatDurationShort(todayTotal)} registradas hoy
              </p>
            </>
          ) : (
            <p className="text-center text-xs text-muted-foreground">
              Todavía no hay nada registrado hoy.
            </p>
          )}
        </div>
        <QuoteCard seed={3} />
      </div>
    </div>
  );
}
