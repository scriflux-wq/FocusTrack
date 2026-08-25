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
    <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-border bg-secondary/40 px-4 py-3">
      <div className="flex items-center gap-2.5 text-sm">
        <CircleDashed className="size-4 text-muted-foreground" />
        <span>
          <span className="font-medium">{formatDurationShort(totalSeconds)}</span>{" "}
          <span className="text-muted-foreground">sin registrar hoy</span>
        </span>
      </div>
      <Button variant="outline" size="sm" onClick={() => setReviewOpen(true)}>
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
