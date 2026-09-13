import { Skeleton } from "@/components/ui/skeleton";
import type { CalendarView } from "./calendar-header";

/**
 * Only ever seen on a hard load of /calendar (first visit, full refresh):
 * in-app navigation goes through `CalendarTransitionProvider`'s
 * `startTransition`, which keeps the previous grid on screen instead of
 * dropping to this fallback while the next one streams in.
 */
export function CalendarGridSkeleton({ view }: { view: CalendarView }) {
  return (
    <>
      <Skeleton className="min-h-0 flex-1 rounded-2xl" />
      {view === "week" && <Skeleton className="h-[74px] w-full shrink-0 rounded-2xl" />}
    </>
  );
}

export function DayDetailSkeleton() {
  return (
    <>
      <Skeleton className="h-56 w-full rounded-3xl" />
      <Skeleton className="h-28 w-full rounded-3xl" />
    </>
  );
}
