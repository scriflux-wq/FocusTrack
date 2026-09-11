"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toZonedTime } from "date-fns-tz";
import { EntryFormSheet } from "@/components/entries/entry-form-sheet";
import { useOrganize } from "@/components/providers/organize-provider";
import { formatDurationShort } from "@/lib/timer/timer-engine";
import { formatInZone } from "@/lib/calendar/date-utils";
import type { TimeEntry } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

export type MonthDay = {
  dayStart: Date;
  dateISO: string;
  dayNumber: number;
  inCurrentMonth: boolean;
  isToday: boolean;
  entries: TimeEntry[];
};

export function MonthGrid({
  weeks,
  timezone,
}: {
  weeks: MonthDay[][];
  timezone: string;
}) {
  const router = useRouter();
  const { categories } = useOrganize();
  const [editing, setEditing] = useState<TimeEntry | null>(null);

  const weekdayLabels = weeks[0].map((d) =>
    formatInZone(d.dayStart, timezone, "EEEEE"),
  );

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-border bg-card">
      <div className="grid shrink-0 grid-cols-7 border-b border-border text-center text-[11px] font-semibold text-muted-foreground sm:text-xs">
        {weekdayLabels.map((label, i) => (
          <div key={i} className="py-2 uppercase tracking-wide">
            {label}
          </div>
        ))}
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-7 grid-rows-6">
        {weeks.flat().map((day) => {
          const dow = toZonedTime(day.dayStart, timezone).getDay();
          const isWeekend = dow === 0 || dow === 6;
          const visible = day.entries.slice(0, 3);
          const hiddenCount = day.entries.length - visible.length;

          return (
            <div
              key={day.dateISO}
              className={cn(
                "group flex min-h-16 min-w-0 flex-col gap-0.5 overflow-hidden border-b border-r border-border p-1 transition-colors last:border-r-0 hover:bg-secondary/40 sm:min-h-20 sm:gap-1 sm:p-1.5 lg:min-h-0",
                !day.inCurrentMonth && "bg-secondary/20",
                isWeekend && day.inCurrentMonth && "bg-secondary/10",
              )}
            >
              <button
                type="button"
                onClick={() => router.push(`/calendar?view=day&date=${day.dateISO}`)}
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center self-end rounded-full text-xs font-semibold transition-colors",
                  day.isToday
                    ? "bg-primary text-primary-foreground"
                    : day.inCurrentMonth
                      ? "text-foreground hover:bg-secondary"
                      : "text-muted-foreground/60",
                )}
              >
                {day.dayNumber}
              </button>
              <div className="flex min-h-0 flex-col gap-0.5 overflow-hidden">
                {visible.map((entry) => {
                  const category = categories.find((c) => c.id === entry.categoryId);
                  const color = category?.color ?? "cat-free";
                  return (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => setEditing(entry)}
                      style={{
                        backgroundColor: `var(--${color}-soft)`,
                        color: `var(--${color})`,
                      }}
                      className="truncate rounded-md px-1.5 py-0.5 text-left text-[10px] font-medium leading-tight"
                    >
                      {entry.title}
                      {entry.durationSeconds ? (
                        <span className="opacity-70"> · {formatDurationShort(entry.durationSeconds)}</span>
                      ) : null}
                    </button>
                  );
                })}
                {hiddenCount > 0 && (
                  <button
                    type="button"
                    onClick={() => router.push(`/calendar?view=day&date=${day.dateISO}`)}
                    className="rounded-md px-1.5 text-left text-[10px] font-medium text-muted-foreground hover:bg-secondary"
                  >
                    +{hiddenCount} más
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {editing && (
        <EntryFormSheet
          open={Boolean(editing)}
          onOpenChange={(o) => !o && setEditing(null)}
          mode="manual"
          entry={editing}
        />
      )}
    </div>
  );
}
