import { CategoryIcon } from "@/components/ui/category-icon";
import { formatDurationShort } from "@/lib/timer/timer-engine";
import type { GroupTotal } from "@/lib/analytics/core";

export function CategorySummary({ totals }: { totals: GroupTotal[] }) {
  const grand = totals.reduce((sum, t) => sum + t.seconds, 0);
  if (grand === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Time by Category</h2>
        <span className="text-xs text-muted-foreground">Today</span>
      </div>
      <div className="-mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-0">
        {totals.slice(0, 8).map((t) => (
          <div
            key={t.key}
            className="flex w-32 shrink-0 flex-col gap-2 rounded-2xl border border-border bg-card p-3 sm:w-auto"
          >
            <CategoryIcon color={t.color ?? "cat-free"} />
            <div>
              <p className="truncate text-sm font-semibold">{t.label}</p>
              <p className="text-xs text-muted-foreground">
                {formatDurationShort(t.seconds)} · {Math.round((t.seconds / grand) * 100)}%
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
