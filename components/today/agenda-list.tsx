"use client";

import { useState } from "react";
import { EntryFormSheet } from "@/components/entries/entry-form-sheet";
import { useOrganize } from "@/components/providers/organize-provider";
import { softChipStyle, dotStyle } from "@/lib/categories";
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
  const { categories, projects } = useOrganize();
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
      <ol className="flex flex-col rounded-2xl border border-border bg-card px-4 py-3">
        {entries.map((entry, i) => {
          const category = categories.find((c) => c.id === entry.categoryId);
          const project = projects.find((p) => p.id === entry.projectId);
          const color = category?.color ?? "cat-free";
          const isLast = i === entries.length - 1;

          return (
            <li key={entry.id} className="flex gap-3">
              <div className="flex w-12 shrink-0 justify-end pt-3.5">
                <span className="text-xs text-muted-foreground tabular-nums">
                  {formatTime(entry.startTime, timezone, timeFormat)}
                </span>
              </div>

              <div className="flex flex-col items-center">
                <span
                  className="mt-4 size-2.5 shrink-0 rounded-full"
                  style={dotStyle(color)}
                />
                {!isLast && <span className="w-px flex-1 bg-border" />}
              </div>

              <button
                type="button"
                onClick={() => setEditing(entry)}
                className={`flex flex-1 items-center justify-between gap-3 rounded-xl px-2 py-3 text-left hover:bg-secondary/60 ${isLast ? "" : "mb-1"}`}
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">{entry.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {project?.name ?? category?.name ?? "Sin categoría"}
                  </span>
                </span>
                <span
                  className="shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold"
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
