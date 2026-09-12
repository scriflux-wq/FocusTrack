"use client";

import { useState } from "react";
import { EntryFormSheet } from "@/components/entries/entry-form-sheet";
import { useOrganize } from "@/components/providers/organize-provider";
import { CategoryIcon } from "@/components/ui/category-icon";
import { softChipStyle, categoryColor } from "@/lib/categories";
import { formatDurationShort } from "@/lib/timer/timer-engine";
import { formatTime } from "@/lib/calendar/date-utils";
import type { TimeEntry } from "@/lib/db/schema";

export function AgendaList({
  entries,
  timezone,
  timeFormat,
}: {
  entries: TimeEntry[];
  timezone: string;
  timeFormat: string;
}) {
  const { categories, subcategories } = useOrganize();
  const [editing, setEditing] = useState<TimeEntry | null>(null);

  if (entries.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        Todavía no hay sesiones hoy.
      </p>
    );
  }

  return (
    <>
      <ol className="flex flex-col gap-1 rounded-2xl border border-border bg-card p-2">
        {entries.map((entry, i) => {
          const category = categories.find((c) => c.id === entry.categoryId);
          const subcategory = subcategories.find((s) => s.id === entry.subcategoryId);
          const color = category?.color ?? "cat-free";
          const isLast = i === entries.length - 1;

          return (
            <li key={entry.id} className="relative flex gap-3">
              {!isLast && (
                <span
                  aria-hidden
                  className="absolute left-[35px] top-12 h-[calc(100%-2.25rem)] w-px bg-border"
                />
              )}

              <button
                type="button"
                onClick={() => setEditing(entry)}
                className="flex flex-1 items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-secondary/60"
              >
                <CategoryIcon color={color} icon={category?.icon} className="relative z-10" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{entry.title}</span>
                  <span className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                    <span className="tabular-nums" style={{ color: categoryColor(color) }}>
                      {formatTime(entry.startTime, timezone, timeFormat)}
                    </span>
                    <span aria-hidden>·</span>
                    {subcategory?.name ?? category?.name ?? "Sin categoría"}
                  </span>
                </span>
                <span
                  className="shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums"
                  style={softChipStyle(color)}
                >
                  {formatDurationShort(entry.durationSeconds ?? 0)}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      {editing && (
        <EntryFormSheet
          open={Boolean(editing)}
          onOpenChange={(o) => !o && setEditing(null)}
          mode="manual"
          entry={editing}
        />
      )}
    </>
  );
}
