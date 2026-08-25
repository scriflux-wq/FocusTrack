"use client";

import { useState } from "react";
import { CategoryDot } from "@/components/ui/category-badge";
import { EntryFormSheet } from "@/components/entries/entry-form-sheet";
import { useOrganize } from "@/components/providers/organize-provider";
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
      <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        Todavía no hay sesiones hoy.
      </p>
    );
  }

  return (
    <>
      <ol className="flex flex-col divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
        {entries.map((entry) => {
          const category = categories.find((c) => c.id === entry.categoryId);
          const project = projects.find((p) => p.id === entry.projectId);
          return (
            <li key={entry.id}>
              <button
                type="button"
                onClick={() => setEditing(entry)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-secondary/60"
              >
                <span className="w-12 shrink-0 text-xs text-muted-foreground tabular-nums">
                  {formatTime(entry.startTime, timezone, timeFormat)}
                </span>
                <CategoryDot color={category?.color ?? "cat-free"} />
                <span className="flex-1 truncate">
                  <span className="font-medium">{entry.title}</span>
                  {project && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      {project.name}
                    </span>
                  )}
                </span>
                <span className="shrink-0 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium">
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
