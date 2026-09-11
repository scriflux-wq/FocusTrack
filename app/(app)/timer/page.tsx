import { getUser } from "@/lib/supabase/server";
import { getFinishedEntriesInRange, getOrCreateSettings } from "@/lib/db/queries";
import { getDayRange, capToNow } from "@/lib/calendar/date-utils";
import { getUntrackedRanges, getUntrackedSeconds } from "@/lib/analytics/core";
import { TimerView } from "@/components/timer/timer-view";
import { TimerMetadataEditor } from "@/components/timer/timer-metadata-editor";
import { AgendaList } from "@/components/today/agenda-list";
import { GapReviewController } from "@/components/today/gap-review-controller";

export default async function TimerPage() {
  const user = await getUser();
  if (!user) return null;

  const settings = await getOrCreateSettings(user.id);
  const now = new Date();
  const { start, end } = getDayRange(now, settings.timezone);
  const entries = await getFinishedEntriesInRange(user.id, start, end);

  // "Untracked" spans the whole calendar day (from midnight), capped so it
  // never claims time that hasn't happened yet.
  const windowEnd = capToNow(end, now);
  const gaps = getUntrackedRanges(entries, start, windowEnd);
  const untrackedSeconds = getUntrackedSeconds(entries, start, windowEnd);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
      <div className="flex flex-col gap-6">
        <TimerView timezone={settings.timezone} timeFormat={settings.timeFormat} />

        <GapReviewController
          gaps={gaps}
          totalSeconds={untrackedSeconds}
          timezone={settings.timezone}
          timeFormat={settings.timeFormat}
        />
      </div>

      <div className="flex flex-col gap-4">
        <TimerMetadataEditor />
        <div>
          <h2 className="mb-2.5 text-sm font-semibold">Today&apos;s Sessions</h2>
          <AgendaList
            entries={entries}
            timezone={settings.timezone}
            timeFormat={settings.timeFormat}
          />
        </div>
      </div>
    </div>
  );
}
