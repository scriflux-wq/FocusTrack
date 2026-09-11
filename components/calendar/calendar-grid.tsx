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

const MINUTES_PER_DAY = 1440;

export type DayColumn = {
  dayStart: Date; // UTC instant of local midnight for this day
  weekdayNarrow: string; // "V"
  weekdayShort: string; // "vie"
  dayNumber: string; // "11"
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

const HOURS = Array.from({ length: 24 }, (_, i) => i);

/**
 * Full 24h grid. Positions are percentages of the day so the same markup fits
 * any height: on desktop the body stretches to the viewport (everything visible
 * at once, no scrollbars); on mobile it falls back to a fixed per-hour height
 * and scrolls vertically. Columns always share the width, so the grid never
 * scrolls horizontally regardless of how many days are shown.
 */
export function CalendarGrid({
  days,
  timezone,
  timeFormat,
}: {
  days: DayColumn[];
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

  const todayStart = nowTick ? getDayRange(nowTick, timezone).start.getTime() : null;

  useEffect(() => {
    const body = bodyRef.current;
    if (hasScrolled.current || !body || !nowTick) return;
    // Only meaningful where the body actually scrolls (mobile).
    if (body.scrollHeight <= body.clientHeight) return;
    const isTodayVisible = days.some((d) => d.dayStart.getTime() === todayStart);
    const targetHour = isTodayVisible
      ? Math.max(0, toZonedTime(nowTick, timezone).getHours() - 1)
      : 7;
    body.scrollTop = (targetHour / 24) * body.scrollHeight;
    hasScrolled.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days.length, nowTick !== null]);

  function handleColumnClick(day: DayColumn, e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientY - rect.top) / rect.height;
    let minutes = Math.round(ratio * MINUTES_PER_DAY);
    minutes = Math.round(minutes / 15) * 15; // snap to 15min
    const start = new Date(day.dayStart.getTime() + minutes * 60 * 1000);
    const end = new Date(start.getTime() + 30 * 60 * 1000);
    setCreating({ start, end });
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-border bg-card">
      {/* Day-name header, pinned above the (possibly scrolling) body */}
      <div className="flex shrink-0 border-b border-border">
        <div className="w-9 shrink-0 sm:w-13" />
        <div
          className="grid flex-1"
          style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}
        >
          {days.map((day) => {
            const isToday = day.dayStart.getTime() === todayStart;
            return (
              <div
                key={day.dayStart.getTime()}
                className="flex min-w-0 items-center justify-center gap-1 border-l border-border py-2 text-[11px] font-semibold capitalize first:border-l-0 sm:text-xs"
              >
                <span className={cn("truncate text-muted-foreground", isToday && "text-primary")}>
                  <span className="sm:hidden">{day.weekdayNarrow}</span>
                  <span className="hidden sm:inline">{day.weekdayShort}</span>
                </span>
                <span
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-full",
                    isToday && "bg-primary text-primary-foreground",
                  )}
                >
                  {day.dayNumber}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/*
        Mobile: fixed 40px per hour inside a scrolling body.
        Desktop (lg): the body fills the remaining height and the inner block
        stretches to 100% of it, so all 24h are visible without scrolling.
      */}
      <div
        ref={bodyRef}
        className="min-h-0 flex-1 overflow-y-auto lg:overflow-hidden [scrollbar-width:thin]"
      >
        <div className="flex h-240 lg:h-full">
          <div
            className="grid w-9 shrink-0 sm:w-13"
            style={{ gridTemplateRows: `repeat(24, minmax(0, 1fr))` }}
          >
            {HOURS.map((h) => (
              <div
                key={h}
                className="flex items-start justify-end pr-1 text-[10px] text-muted-foreground sm:pr-1.5 sm:text-[11px]"
              >
                <span className="-translate-y-1/2 tabular-nums">
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
              const nowPct =
                isToday && nowTick
                  ? ((nowTick.getTime() - day.dayStart.getTime()) / 60000 / MINUTES_PER_DAY) * 100
                  : null;

              return (
                <div
                  key={day.dayStart.getTime()}
                  className={cn(
                    "relative min-w-0 border-l border-border first:border-l-0",
                    isWeekend && "bg-secondary/30",
                    isToday && "bg-primary/[0.04]",
                  )}
                >
                  <div
                    className="relative h-full cursor-pointer"
                    onClick={(e) => handleColumnClick(day, e)}
                  >
                    <div
                      className="grid h-full"
                      style={{ gridTemplateRows: `repeat(24, minmax(0, 1fr))` }}
                    >
                      {HOURS.map((h) => (
                        <div key={h} className="relative">
                          <div className="absolute inset-x-0 top-0 border-t border-border/70" />
                          <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-border/40" />
                        </div>
                      ))}
                    </div>

                    {nowPct !== null && nowPct >= 0 && nowPct <= 100 && (
                      <div
                        className="pointer-events-none absolute inset-x-0 z-20 flex items-center"
                        style={{ top: `${nowPct}%` }}
                      >
                        <span className="-ml-[3px] size-2 rounded-full bg-primary" />
                        <span className="h-px flex-1 bg-primary" />
                      </div>
                    )}

                    {laidOut.map(({ entry, column, columnCount }) => {
                      const category = categories.find((c) => c.id === entry.categoryId);
                      const color = category?.color ?? "cat-free";
                      const startMin =
                        (entry.startTime.getTime() - day.dayStart.getTime()) / 60000;
                      const endMin = entry.endTime
                        ? (entry.endTime.getTime() - day.dayStart.getTime()) / 60000
                        : startMin + 15;
                      const topPct = Math.max(0, (startMin / MINUTES_PER_DAY) * 100);
                      const heightPct = Math.max(
                        0.6,
                        ((endMin - startMin) / MINUTES_PER_DAY) * 100,
                      );
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
                            top: `${topPct}%`,
                            height: `${heightPct}%`,
                            left: `calc(${column * widthPct}% + 2px)`,
                            width: `calc(${widthPct}% - 4px)`,
                            backgroundColor: `var(--${color}-soft)`,
                            borderLeftColor: `var(--${color})`,
                          }}
                          className="absolute z-10 min-h-3.5 overflow-hidden rounded-md border-l-[3px] px-1 py-0.5 text-left text-[10px] leading-tight shadow-sm transition-transform hover:z-20 hover:scale-[1.02] hover:shadow-md sm:rounded-lg sm:px-1.5 sm:text-[11px]"
                        >
                          <p
                            className="truncate font-semibold"
                            style={{ color: `var(--${color})` }}
                          >
                            {entry.title}
                          </p>
                          <p className="truncate text-muted-foreground">
                            {formatTime(entry.startTime, timezone, timeFormat)} ·{" "}
                            {formatDurationShort(entry.durationSeconds ?? 0)}
                          </p>
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
