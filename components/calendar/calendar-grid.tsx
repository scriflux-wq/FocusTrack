"use client";

import { useEffect, useRef, useState } from "react";
import { EntryFormSheet } from "@/components/entries/entry-form-sheet";
import { useOrganize } from "@/components/providers/organize-provider";
import { useNow } from "@/hooks/use-now";
import { formatDurationShort } from "@/lib/timer/timer-engine";
import { formatTime, getDayRange } from "@/lib/calendar/date-utils";
import { toZonedTime } from "date-fns-tz";
import type { TimeEntry } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

const HOUR_HEIGHT = 64;
const GUTTER_WIDTH = 52;
const BODY_MAX_HEIGHT = "min(68vh, 46rem)";

export type DayColumn = {
  dayStart: Date; // UTC instant of local midnight for this day
  dateLabel: string; // "Lun 24" style
  entries: TimeEntry[];
};

type LaidOutEntry = { entry: TimeEntry; column: number; columnCount: number };

/** Assigns overlapping entries to side-by-side columns so they never visually collide. */
function layoutOverlaps(entries: TimeEntry[]): LaidOutEntry[] {
  const sorted = [...entries].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  const columns: TimeEntry[][] = [];
  const assignment = new Map<string, number>();

  for (const entry of sorted) {
    let placed = false;
    for (let c = 0; c < columns.length; c++) {
      const last = columns[c][columns[c].length - 1];
      const lastEnd = last.endTime ?? new Date(last.startTime.getTime() + 15 * 60000);
      if (entry.startTime >= lastEnd) {
        columns[c].push(entry);
        assignment.set(entry.id, c);
        placed = true;
        break;
      }
    }
    if (!placed) {
      columns.push([entry]);
      assignment.set(entry.id, columns.length - 1);
    }
  }

  const columnCount = Math.max(1, columns.length);
  return sorted.map((entry) => ({ entry, column: assignment.get(entry.id)!, columnCount }));
}

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
  // Null on the server and on first client paint (avoids a hydration
  // mismatch on the "now" line's exact pixel position); fills in right after.
  const nowTick = useNow();
  const bodyRef = useRef<HTMLDivElement>(null);
  const hasScrolled = useRef(false);

  const totalHours = dayEndHour - dayStartHour;
  const hours = Array.from({ length: totalHours }, (_, i) => dayStartHour + i);
  const todayStart = nowTick ? getDayRange(nowTick, timezone).start.getTime() : null;

  useEffect(() => {
    if (hasScrolled.current || !bodyRef.current || !nowTick) return;
    const isTodayVisible = days.some((d) => d.dayStart.getTime() === todayStart);
    const targetHour = isTodayVisible
      ? Math.max(dayStartHour, toZonedTime(nowTick, timezone).getHours() - 1)
      : Math.max(dayStartHour, 7);
    bodyRef.current.scrollTop = (targetHour - dayStartHour) * HOUR_HEIGHT;
    hasScrolled.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days.length, nowTick !== null]);

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
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      {/* Fixed day-name header */}
      <div className="flex border-b border-border">
        <div style={{ width: GUTTER_WIDTH }} className="shrink-0" />
        <div
          className="grid flex-1"
          style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}
        >
          {days.map((day) => {
            const isToday = day.dayStart.getTime() === todayStart;
            return (
              <div
                key={day.dateLabel}
                className="flex items-center justify-center gap-1.5 border-l border-border py-2.5 text-xs font-semibold capitalize first:border-l-0"
              >
                <span className={cn("text-muted-foreground", isToday && "text-primary")}>
                  {day.dateLabel.split(" ")[0]}
                </span>
                <span
                  className={cn(
                    "flex size-5 items-center justify-center rounded-full",
                    isToday && "bg-primary text-primary-foreground",
                  )}
                >
                  {day.dateLabel.split(" ")[1]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Scrollable hour body */}
      <div ref={bodyRef} className="overflow-y-auto" style={{ maxHeight: BODY_MAX_HEIGHT }}>
        <div className="flex">
          <div style={{ width: GUTTER_WIDTH }} className="relative shrink-0">
            {hours.map((h) => (
              <div
                key={h}
                style={{ height: HOUR_HEIGHT }}
                className="flex items-start justify-end pr-1.5 text-[11px] text-muted-foreground"
              >
                <span className="-translate-y-1/2">
                  {formatTime(new Date(days[0].dayStart.getTime() + h * 3600000), timezone, timeFormat)}
                </span>
              </div>
            ))}
          </div>

          <div
            className="grid flex-1"
            style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}
          >
            {days.map((day) => {
              const isToday = day.dayStart.getTime() === todayStart;
              const zonedDow = toZonedTime(day.dayStart, timezone).getDay();
              const isWeekend = zonedDow === 0 || zonedDow === 6;
              const laidOut = layoutOverlaps(day.entries);
              const nowOffsetMin =
                isToday && nowTick
                  ? (nowTick.getTime() - day.dayStart.getTime()) / 60000 - dayStartHour * 60
                  : null;

              return (
                <div
                  key={day.dateLabel}
                  className={cn(
                    "relative border-l border-border first:border-l-0",
                    isWeekend && "bg-secondary/30",
                  )}
                >
                  <div
                    className="relative cursor-pointer"
                    style={{ height: totalHours * HOUR_HEIGHT }}
                    onClick={(e) => handleColumnClick(day, e)}
                  >
                    {hours.map((h) => (
                      <div key={h} style={{ height: HOUR_HEIGHT }} className="relative">
                        <div className="absolute inset-x-0 top-0 border-t border-border/70" />
                        <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-border/40" />
                      </div>
                    ))}

                    {nowOffsetMin !== null &&
                      nowOffsetMin >= 0 &&
                      nowOffsetMin <= totalHours * 60 && (
                        <div
                          className="pointer-events-none absolute inset-x-0 z-20 flex items-center"
                          style={{ top: (nowOffsetMin / 60) * HOUR_HEIGHT }}
                        >
                          <span className="-ml-[3px] size-2 rounded-full bg-primary" />
                          <span className="h-px flex-1 bg-primary" />
                        </div>
                      )}

                    {laidOut.map(({ entry, column, columnCount }) => {
                      const category = categories.find((c) => c.id === entry.categoryId);
                      const color = category?.color ?? "cat-free";
                      const startMin =
                        (entry.startTime.getTime() - day.dayStart.getTime()) / 60000 -
                        dayStartHour * 60;
                      const endMin = entry.endTime
                        ? (entry.endTime.getTime() - day.dayStart.getTime()) / 60000 -
                          dayStartHour * 60
                        : startMin + 15;
                      const top = Math.max(0, (startMin / 60) * HOUR_HEIGHT);
                      const height = Math.max(22, ((endMin - startMin) / 60) * HOUR_HEIGHT);
                      const widthPct = 100 / columnCount;

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
                            left: `calc(${column * widthPct}% + 2px)`,
                            width: `calc(${widthPct}% - 4px)`,
                            backgroundColor: `var(--${color}-soft)`,
                            borderLeftColor: `var(--${color})`,
                          }}
                          className="absolute overflow-hidden rounded-lg border-l-[3px] px-1.5 py-1 text-left text-[11px] leading-tight shadow-sm transition-transform hover:z-10 hover:scale-[1.02] hover:shadow-md"
                        >
                          <p className="truncate font-semibold" style={{ color: `var(--${color})` }}>
                            {entry.title}
                          </p>
                          {height > 34 && (
                            <p className="truncate text-muted-foreground">
                              {formatTime(entry.startTime, timezone, timeFormat)} ·{" "}
                              {formatDurationShort(entry.durationSeconds ?? 0)}
                            </p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
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
