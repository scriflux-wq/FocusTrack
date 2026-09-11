"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ResponsiveSheet } from "@/components/ui/responsive-sheet";
import { EntryFormSheet } from "@/components/entries/entry-form-sheet";
import { formatDurationShort } from "@/lib/timer/timer-engine";
import { formatTime } from "@/lib/calendar/date-utils";

export type Gap = { start: Date; end: Date };

export function GapReviewSheet({
  open,
  onOpenChange,
  gaps,
  timezone,
  timeFormat,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gaps: Gap[];
  timezone: string;
  timeFormat: string;
}) {
  const [logging, setLogging] = useState<Gap | null>(null);

  return (
    <>
      <ResponsiveSheet
        open={open}
        onOpenChange={onOpenChange}
        title="Tiempo sin registrar"
        description="Convierte estos huecos en actividades, o déjalos así."
      >
        <ul className="flex flex-col gap-2 pt-2">
          {gaps.map((gap) => (
            <li
              key={gap.start.toISOString()}
              className="flex items-center justify-between gap-3 rounded-xl border border-border p-3"
            >
              <div className="text-sm">
                <p className="font-medium">
                  {formatTime(gap.start, timezone, timeFormat)} –{" "}
                  {formatTime(gap.end, timezone, timeFormat)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDurationShort((gap.end.getTime() - gap.start.getTime()) / 1000)}
                </p>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  onOpenChange(false);
                  setLogging(gap);
                }}
              >
                Registrar
              </Button>
            </li>
          ))}
          {gaps.length === 0 && (
            <p className="p-4 text-center text-sm text-muted-foreground">
              No hay huecos sin registrar ahora mismo.
            </p>
          )}
        </ul>
      </ResponsiveSheet>

      {logging && (
        <EntryFormSheet
          open={Boolean(logging)}
          onOpenChange={(o) => !o && setLogging(null)}
          mode="manual"
          defaultStart={logging.start}
          defaultEnd={logging.end}
        />
      )}
    </>
  );
}
