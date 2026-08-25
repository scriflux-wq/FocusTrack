"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { EntryFormSheet } from "@/components/entries/entry-form-sheet";
import { useOrganize } from "@/components/providers/organize-provider";
import { CategoryDot } from "@/components/ui/category-badge";
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

export function MonthGrid({ weeks }: { weeks: MonthDay[][] }) {
  const router = useRouter();
  const { categories } = useOrganize();
  const [editing, setEditing] = useState<TimeEntry | null>(null);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="grid grid-cols-7 border-b border-border text-center text-xs font-medium text-muted-foreground">
        {["L", "M", "X", "J", "V", "S", "D"].map((d) => (
          <div key={d} className="py-2">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {weeks.flat().map((day) => (
          <div
            key={day.dateISO}
            className={cn(
              "flex min-h-24 flex-col gap-1 border-b border-r border-border p-1.5 last:border-r-0",
              !day.inCurrentMonth && "bg-secondary/30 text-muted-foreground",
            )}
          >
            <button
              type="button"
              onClick={() => router.push(`/calendar?view=day&date=${day.dateISO}`)}
              className={cn(
                "flex size-6 items-center justify-center self-end rounded-full text-xs font-medium",
                day.isToday && "bg-primary text-primary-foreground",
              )}
            >
              {day.dayNumber}
            </button>
            <div className="flex flex-col gap-0.5">
              {day.entries.slice(0, 3).map((entry) => {
                const category = categories.find((c) => c.id === entry.categoryId);
                return (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => setEditing(entry)}
                    className="flex items-center gap-1 truncate rounded px-1 py-0.5 text-left text-[10px] hover:bg-secondary"
                  >
                    <CategoryDot color={category?.color ?? "cat-free"} />
                    <span className="truncate">{entry.title}</span>
                  </button>
                );
              })}
              {day.entries.length > 3 && (
                <span className="px-1 text-[10px] text-muted-foreground">
                  +{day.entries.length - 3} más
                </span>
              )}
            </div>
          </div>
        ))}
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
