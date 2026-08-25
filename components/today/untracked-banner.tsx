"use client";

import { useState } from "react";
import { CircleDashed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResponsiveSheet } from "@/components/ui/responsive-sheet";
import { EntryFormSheet } from "@/components/entries/entry-form-sheet";
import { formatDurationShort } from "@/lib/timer/timer-engine";
import { formatTime } from "@/lib/calendar/date-utils";

type Gap = { start: Date; end: Date };

export function UntrackedBanner({
  gaps,
  totalSeconds,
  timezone,
  timeFormat,
}: {
  gaps: Gap[];
  totalSeconds: number;
  timezone: string;
  timeFormat: string;
}) {
  const [reviewOpen, setReviewOpen] = useState(false);
  const [logging, setLogging] = useState<Gap | null>(null);

  if (totalSeconds < 60 || gaps.length === 0) return null;

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3.5">
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/40 text-muted-foreground">
          <CircleDashed className="size-4.5" />
        </span>
        <div>
          <p className="text-sm font-semibold">Tiempo sin registrar</p>
          <p className="text-xs text-muted-foreground">
            {formatDurationShort(totalSeconds)} en tu día
          </p>
        </div>
      </div>
      <Button
        size="sm"
        className="rounded-full bg-accent text-accent-foreground hover:bg-accent/80"
        onClick={() => setReviewOpen(true)}
      >
        Revisar
      </Button>

      <ResponsiveSheet
        open={reviewOpen}
        onOpenChange={setReviewOpen}
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
                  setReviewOpen(false);
                  setLogging(gap);
                }}
              >
                Registrar
              </Button>
            </li>
          ))}
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
    </div>
  );
}
