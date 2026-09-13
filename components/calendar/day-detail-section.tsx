import { getFinishedEntriesInRange } from "@/lib/db/queries";
import { getDayRange, formatDayLabel } from "@/lib/calendar/date-utils";
import { DayDetailPanel } from "./day-detail-panel";
import { QuoteCard } from "@/components/ui/quote-card";

/**
 * Independent of `CalendarGridSection`'s (possibly much wider) range query —
 * always just the one selected day — so it resolves and streams in on its
 * own regardless of which grid view is showing.
 */
export async function DayDetailSection({
  userId,
  referenceDate,
  tz,
  timeFormat,
  quoteSeed,
}: {
  userId: string;
  referenceDate: Date;
  tz: string;
  timeFormat: string;
  quoteSeed: number;
}) {
  const { start, end } = getDayRange(referenceDate, tz);
  const entries = await getFinishedEntriesInRange(userId, start, end);

  return (
    <>
      <DayDetailPanel
        label={formatDayLabel(referenceDate, tz)}
        entries={entries}
        timezone={tz}
        timeFormat={timeFormat}
      />
      <QuoteCard seed={quoteSeed} />
    </>
  );
}
