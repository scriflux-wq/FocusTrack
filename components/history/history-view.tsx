"use client";

import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CategoryDot } from "@/components/ui/category-badge";
import { EntryFormSheet } from "@/components/entries/entry-form-sheet";
import { useOrganize } from "@/components/providers/organize-provider";
import { formatDurationShort } from "@/lib/timer/timer-engine";
import { formatTime } from "@/lib/calendar/date-utils";
import type { TimeEntry } from "@/lib/db/schema";

export function HistoryView({
  entries,
  timezone,
  timeFormat,
}: {
  entries: TimeEntry[];
  timezone: string;
  timeFormat: string;
}) {
  const { categories, projects } = useOrganize();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<TimeEntry | null>(null);
  const [creating, setCreating] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((e) => {
      const project = projects.find((p) => p.id === e.projectId);
      const category = categories.find((c) => c.id === e.categoryId);
      return (
        e.title.toLowerCase().includes(q) ||
        project?.name.toLowerCase().includes(q) ||
        category?.name.toLowerCase().includes(q)
      );
    });
  }, [entries, query, projects, categories]);

  const grouped = useMemo(() => {
    const groups = new Map<string, TimeEntry[]>();
    for (const e of filtered) {
      const key = e.startTime.toLocaleDateString("es-ES", {
        timeZone: timezone,
        weekday: "long",
        day: "numeric",
        month: "short",
      });
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(e);
    }
    return [...groups.entries()];
  }, [filtered, timezone]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">History</h1>
        <Button onClick={() => setCreating(true)}>
          <Plus className="size-4" />
          Nueva sesión
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por actividad, proyecto o categoría…"
          className="pl-9"
        />
      </div>

      {grouped.length === 0 && (
        <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No hay sesiones que coincidan.
        </p>
      )}

      {grouped.map(([day, dayEntries]) => (
        <div key={day} className="flex flex-col gap-2">
          <h2 className="text-sm font-medium capitalize text-muted-foreground">{day}</h2>
          <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
            {dayEntries.map((entry) => {
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
          </ul>
        </div>
      ))}

      {editing && (
        <EntryFormSheet
          open={Boolean(editing)}
          onOpenChange={(o) => !o && setEditing(null)}
          mode="manual"
          entry={editing}
        />
      )}
      <EntryFormSheet open={creating} onOpenChange={setCreating} mode="manual" />
    </div>
  );
}
