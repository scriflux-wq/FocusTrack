"use client";

import { useState } from "react";
import { EntryFormSheet } from "@/components/entries/entry-form-sheet";
import { useOrganize } from "@/components/providers/organize-provider";
import { formatDurationShort } from "@/lib/timer/timer-engine";
import { formatTime } from "@/lib/calendar/date-utils";
import type { TimeEntry } from "@/lib/db/schema";

const HOUR_HEIGHT = 56;

export type DayColumn = {
  dayStart: Date; // UTC instant of local midnight for this day
  dateLabel: string; // "Lun 24" style
  entries: TimeEntry[];
};

export function CalendarGrid({
  days,
  dayStartHour,
  dayEndHour,
  timezone,
  timeFormat,
}: {
  days: DayColumn[];
  dayStartHour: number;
  dayEndHour: number;
  timezone: string;
  timeFormat: string;
}) {
  const { categories } = useOrganize();
  const [editing, setEditing] = useState<TimeEntry | null>(null);
  const [creating, setCreating] = useState<{ start: Date; end: Date } | null>(null);

  const totalHours = dayEndHour - dayStartHour;
  const hours = Array.from({ length: totalHours + 1 }, (_, i) => dayStartHour + i);

  function handleColumnClick(day: DayColumn, e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    let minutes = Math.round((offsetY / HOUR_HEIGHT) * 60) + dayStartHour * 60;
    minutes = Math.round(minutes / 15) * 15; // snap to 15min
    const start = new Date(day.dayStart.getTime() + minutes * 60 * 1000);
    const end = new Date(start.getTime() + 30 * 60 * 1000);
    setCreating({ start, end });
  }

  return (
    <div className="flex overflow-hidden rounded-xl border border-border bg-card">
      <div className="w-12 shrink-0 border-r border-border">
        <div className="h-8 border-b border-border" />
        {hours.map((h) => (
          <div
            key={h}
            style={{ height: HOUR_HEIGHT }}
            className="border-b border-border/60 pr-1.5 text-right text-[11px] text-muted-foreground"
          >
            {String(h).padStart(2, "0")}:00
          </div>
        ))}
      </div>

      <div className="grid flex-1" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}>
        {days.map((day) => (
          <div key={day.dateLabel} className="relative border-r border-border last:border-r-0">
            <div className="flex h-8 items-center justify-center border-b border-border text-xs font-medium capitalize">
              {day.dateLabel}
            </div>
            <div
              className="relative cursor-pointer"
              style={{ height: totalHours * HOUR_HEIGHT }}
              onClick={(e) => handleColumnClick(day, e)}
            >
              {hours.slice(0, -1).map((h) => (
                <div
                  key={h}
                  style={{ height: HOUR_HEIGHT }}
                  className="border-b border-border/60"
                />
              ))}

              {day.entries.map((entry) => {
                const category = categories.find((c) => c.id === entry.categoryId);
                const startMin =
                  (entry.startTime.getTime() - day.dayStart.getTime()) / 60000 -
                  dayStartHour * 60;
                const endMin = entry.endTime
                  ? (entry.endTime.getTime() - day.dayStart.getTime()) / 60000 -
                    dayStartHour * 60
                  : startMin + 15;
                const top = Math.max(0, (startMin / 60) * HOUR_HEIGHT);
                const height = Math.max(20, ((endMin - startMin) / 60) * HOUR_HEIGHT);

                return (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditing(entry);
                    }}
                    style={{
                      top,
                      height,
                      backgroundColor: `var(--${category?.color ?? "cat-free"}-soft)`,
                      color: `var(--${category?.color ?? "cat-free"})`,
                    }}
                    className="absolute inset-x-1 overflow-hidden rounded-md px-1.5 py-0.5 text-left text-[11px] leading-tight shadow-sm"
                  >
                    <p className="truncate font-medium">{entry.title}</p>
                    {height > 32 && (
                      <p className="truncate opacity-80">
                        {formatTime(entry.startTime, timezone, timeFormat)} ·{" "}
                        {formatDurationShort(entry.durationSeconds ?? 0)}
                      </p>
                    )}
                  </button>
                );
              })}
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
      {creating && (
        <EntryFormSheet
          open={Boolean(creating)}
          onOpenChange={(o) => !o && setCreating(null)}
          mode="manual"
          defaultStart={creating.start}
          defaultEnd={creating.end}
        />
      )}
    </div>
  );
}
