import { CategoryDot } from "@/components/ui/category-badge";
import { formatDurationShort } from "@/lib/timer/timer-engine";
import type { GroupTotal } from "@/lib/analytics/core";

export function CategorySummary({ totals }: { totals: GroupTotal[] }) {
  const grand = totals.reduce((sum, t) => sum + t.seconds, 0);
  if (grand === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2.5">
      <h2 className="text-sm font-medium text-muted-foreground">Por categoría</h2>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {totals.slice(0, 8).map((t) => (
          <div
            key={t.key}
            className="flex flex-col gap-1 rounded-xl border border-border bg-card p-3"
          >
            <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <CategoryDot color={t.color ?? "cat-free"} />
              {t.label}
            </span>
            <span className="text-sm font-semibold">
              {formatDurationShort(t.seconds)}
            </span>
            <span className="text-xs text-muted-foreground">
              {Math.round((t.seconds / grand) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
