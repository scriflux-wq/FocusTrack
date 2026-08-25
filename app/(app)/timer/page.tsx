import { getUser } from "@/lib/supabase/server";
import { getFinishedEntriesInRange, getOrCreateSettings } from "@/lib/db/queries";
import { getDayRange, capToNow } from "@/lib/calendar/date-utils";
import { getUntrackedRanges, getUntrackedSeconds } from "@/lib/analytics/core";
import { TimerView } from "@/components/timer/timer-view";
import { AgendaList } from "@/components/today/agenda-list";
import { UntrackedBanner } from "@/components/today/untracked-banner";

export default async function TimerPage() {
  const user = await getUser();
  if (!user) return null;

  const settings = await getOrCreateSettings(user.id);
  const now = new Date();
  const { start, end } = getDayRange(now, settings.timezone);
  const entries = await getFinishedEntriesInRange(user.id, start, end);

  const [sh, sm] = settings.dayStartTime.split(":").map(Number);
  const [eh, em] = settings.dayEndTime.split(":").map(Number);
  const windowStart = new Date(start.getTime() + (sh * 60 + sm) * 60000);
  // Never claim time that hasn't happened yet is "untracked".
  const windowEnd = capToNow(new Date(start.getTime() + (eh * 60 + em) * 60000), now);
  const gaps = getUntrackedRanges(entries, windowStart, windowEnd);
  const untrackedSeconds = getUntrackedSeconds(entries, windowStart, windowEnd);

  return (
    <div className="flex flex-col gap-6">
      <TimerView />

      <UntrackedBanner
        gaps={gaps}
        totalSeconds={untrackedSeconds}
        timezone={settings.timezone}
        timeFormat={settings.timeFormat}
      />

      <div>
        <h2 className="mb-2.5 text-sm font-semibold">Today&apos;s Sessions</h2>
        <AgendaList
          entries={entries}
          timezone={settings.timezone}
          timeFormat={settings.timeFormat}
        />
      </div>
    </div>
  );
}
