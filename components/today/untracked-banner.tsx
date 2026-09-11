"use client";

import { CircleDashed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDurationShort } from "@/lib/timer/timer-engine";

export function UntrackedBanner({
  totalSeconds,
  gapCount,
  onReview,
}: {
  totalSeconds: number;
  gapCount: number;
  onReview: () => void;
}) {
  if (totalSeconds < 60 || gapCount === 0) return null;

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
        onClick={onReview}
      >
        Revisar
      </Button>
    </div>
  );
}
