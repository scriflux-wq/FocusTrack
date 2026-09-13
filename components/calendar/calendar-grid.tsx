"use client";

import { useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { CategoryIcon } from "@/components/ui/category-icon";
import { EntryFormSheet } from "@/components/entries/entry-form-sheet";
import { useOrganize } from "@/components/providers/organize-provider";
import { useNow } from "@/hooks/use-now";
import { formatDurationShort } from "@/lib/timer/timer-engine";
import { formatTime, getDayRange } from "@/lib/calendar/date-utils";
import { categoryColor, categorySoftColor } from "@/lib/categories";
import { toZonedTime } from "date-fns-tz";
import type { TimeEntry } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

const MINUTES_PER_DAY = 1440;

/**
 * The part of a session that falls on one calendar day. A session crossing
 * midnight (sleep) yields one segment per day it touches; `entry` is the
 * untouched original so editing works on the real session.
 */
export type DaySegment = {
  entry: TimeEntry;
  start: Date;
  end: Date;
  continuesBefore: boolean;
  continuesAfter: boolean;
};

export type DayColumn = {
  dayStart: Date; // UTC instant of local midnight for this day
  weekdayNarrow: string; // "V"
  weekdayShort: string; // "vie"
  dayNumber: string; // "11"
  monthShort: string; // "sep"
  segments: DaySegment[];
};

type LaidOut = { segment: DaySegment; column: number; columnCount: number };

/** Assigns overlapping segments to side-by-side columns so they never visually collide. */
function layoutOverlaps(segments: DaySegment[]): LaidOut[] {
  const sorted = [...segments].sort((a, b) => a.start.getTime() - b.start.getTime());
  const columns: DaySegment[][] = [];
  const assignment = new Map<DaySegment, number>();

  for (const segment of sorted) {
    let placed = false;
    for (let c = 0; c < columns.length; c++) {
      const last = columns[c][columns[c].length - 1];
      if (segment.start >= last.end) {
        columns[c].push(segment);
        assignment.set(segment, c);
        placed = true;
        break;
      }
    }
    if (!placed) {
      columns.push([segment]);
      assignment.set(segment, columns.length - 1);
    }
  }

  const columnCount = Math.max(1, columns.length);
  return sorted.map((segment) => ({ segment, column: assignment.get(segment)!, columnCount }));
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
  const gridRef = useRef<HTMLDivElement>(null);
  const hasScrolled = useRef(false);
  // Real pixels per hour, so a card knows whether it has room for its time
  // line. Percent-of-day can't tell: a 1h block is 4% of the day whether that
  // is 25px on a laptop or 45px on a tall monitor.
  const [hourPx, setHourPx] = useState<number | null>(null);

  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const measure = () => setHourPx(el.clientHeight / 24);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const todayStart = nowTick ? getDayRange(nowTick, timezone).start.getTime() : null;

  useEffect(() => {
    const body = bodyRef.current;
    if (hasScrolled.current || !body || !nowTick) return;
    // Only where the body is a real scroller (mobile). An overflow:hidden body
    // still accepts scrollTop, which once shifted the desktop grid by hours.
    if (getComputedStyle(body).overflowY !== "auto") return;
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
      <div className="flex shrink-0 border-b border-border/70">
        <div className="w-9 shrink-0 sm:w-13" />
        <div
          className="grid flex-1"
          style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}
        >
          {days.map((day) => {
            const isToday = day.dayStart.getTime() === todayStart;
            // A dot under the date, tinted by the day's first session, hints
            // at where the time went without reading the grid.
            const firstCategory = categories.find(
              (c) => c.id === day.segments[0]?.entry.categoryId,
            );
            return (
              <div
                key={day.dayStart.getTime()}
                className={cn(
                  "flex min-w-0 flex-col items-center justify-center gap-0.5 border-l border-border py-2 capitalize first:border-l-0 sm:py-2.5",
                  isToday && "bg-primary/[0.07]",
                )}
              >
                <span
                  className={cn(
                    "truncate text-[10px] font-medium text-muted-foreground sm:text-[11px]",
                    isToday && "text-primary",
                  )}
                >
                  <span className="sm:hidden">{day.weekdayNarrow}</span>
                  <span className="hidden sm:inline">{day.weekdayShort}</span>
                </span>
                <span
                  className={cn(
                    "truncate text-xs font-semibold sm:text-sm",
                    isToday ? "text-primary" : "text-foreground",
                  )}
                >
                  {day.dayNumber}
                  <span className="hidden sm:inline"> {day.monthShort}</span>
                </span>
                <span
                  className="size-1.5 rounded-full"
                  style={{
                    backgroundColor: firstCategory
                      ? categoryColor(firstCategory.color)
                      : "transparent",
                  }}
                />
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
        <div ref={gridRef} className="flex h-240 lg:h-full">
          <div
            className="grid w-9 shrink-0 sm:w-13"
            style={{ gridTemplateRows: `repeat(24, minmax(0, 1fr))` }}
          >
            {HOURS.map((h) => (
              <div
                key={h}
                className="flex items-start justify-end pr-1.5 text-[10px] text-muted-foreground/70 sm:pr-2 sm:text-[11px]"
              >
                <span className={cn("tabular-nums", h > 0 && "-translate-y-1/2")}>
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
              const laidOut = layoutOverlaps(day.segments);
              const nowPct =
                isToday && nowTick
                  ? ((nowTick.getTime() - day.dayStart.getTime()) / 60000 / MINUTES_PER_DAY) * 100
                  : null;

              return (
                <div
                  key={day.dayStart.getTime()}
                  className={cn(
                    "@container relative min-w-0 overflow-hidden border-l border-border/60 first:border-l-0",
                    isWeekend && !isToday && "bg-secondary/25",
                    isToday && "bg-primary/[0.07]",
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
                        <div
                          key={h}
                          className="group/hour relative border-t border-border/50 first:border-t-0"
                        >
                          {/* Hover affordance for the click-to-create empty slot */}
                          <span className="pointer-events-none absolute inset-0.5 flex items-center justify-center rounded-lg border border-dashed border-primary/0 text-primary/0 transition-colors group-hover/hour:border-primary/40 group-hover/hour:bg-primary/5 group-hover/hour:text-primary/70">
                            <Plus className="size-3.5" />
                          </span>
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

                    {laidOut.map(({ segment, column, columnCount }) => {
                      const { entry } = segment;
                      const category = categories.find((c) => c.id === entry.categoryId);
                      const color = category?.color ?? "cat-free";
                      const startMin = (segment.start.getTime() - day.dayStart.getTime()) / 60000;
                      const endMin = (segment.end.getTime() - day.dayStart.getTime()) / 60000;
                      const topPct = (startMin / MINUTES_PER_DAY) * 100;
                      const heightPct = Math.max(0.6, ((endMin - startMin) / MINUTES_PER_DAY) * 100);
                      const widthPct = 100 / columnCount;

                      // Title in a deeper shade of the category (mixed toward
                      // the foreground) so pale presets like Sand or Sky still
                      // read on their own pastel fill.
                      const titleColor = `color-mix(in oklch, ${categoryColor(color)} 70%, var(--foreground))`;
                      // Only the title fits when the card is shorter than two lines.
                      const compact =
                        hourPx !== null && ((endMin - startMin) / 60) * hourPx < 34;

                      return (
                        <button
                          key={`${entry.id}-${segment.start.getTime()}`}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditing(entry);
                          }}
                          style={{
                            top: `${topPct}%`,
                            height: `${heightPct}%`,
                            left: `calc(${column * widthPct}% + 3px)`,
                            width: `calc(${widthPct}% - 6px)`,
                            backgroundColor: categorySoftColor(color),
                            borderColor: `color-mix(in oklch, ${categoryColor(color)} 25%, transparent)`,
                          }}
                          className={cn(
                            "absolute z-10 flex min-h-4 items-start gap-1.5 overflow-hidden border px-1.5 py-1 text-left text-[10px] leading-tight shadow-[inset_0_1px_0_0_oklch(1_0_0/0.45),0_1px_3px_oklch(0_0_0/0.05)] backdrop-blur-sm transition-[transform,box-shadow] hover:z-20 hover:scale-[1.015] hover:shadow-md sm:px-2 sm:py-1.5 sm:text-[11px]",
                            // Squared edges mark where the session runs on into the next/previous day.
                            segment.continuesBefore ? "rounded-t-none" : "rounded-t-xl",
                            segment.continuesAfter ? "rounded-b-none" : "rounded-b-xl",
                          )}
                        >
                          {!compact && (
                            <CategoryIcon
                              color={color}
                              icon={category?.icon}
                              variant="onCard"
                              className="mt-px hidden size-6 @[120px]:flex"
                              iconClassName="size-3.5"
                            />
                          )}
                          <span className="min-w-0 flex-1">
                            <p className="truncate font-semibold" style={{ color: titleColor }}>
                              {segment.continuesBefore && "… "}
                              {entry.title}
                            </p>
                            {!compact && (
                              <p className="truncate tabular-nums text-muted-foreground">
                                {formatTime(entry.startTime, timezone, timeFormat)}
                                {entry.endTime &&
                                  ` – ${formatTime(entry.endTime, timezone, timeFormat)}`}
                                <span className="hidden @[150px]:inline">
                                  {" · "}
                                  {formatDurationShort(entry.durationSeconds ?? 0)}
                                </span>
                              </p>
                            )}
                          </span>
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
