"use client";

import Link from "next/link";
import { Pause, Play, Square } from "lucide-react";
import { useTimerStore } from "@/lib/timer/use-timer-store";
import { useElapsedSeconds } from "@/lib/timer/use-elapsed";
import { formatDurationClock } from "@/lib/timer/timer-engine";
import { cn } from "@/lib/utils";

/** Persistent mini timer widget, desktop only (mobile uses the bottom-nav center button). */
export function TimerFab() {
  const entry = useTimerStore((s) => s.activeEntry);
  const pending = useTimerStore((s) => s.pending);
  const pause = useTimerStore((s) => s.pause);
  const resume = useTimerStore((s) => s.resume);
  const finish = useTimerStore((s) => s.finish);
  const elapsed = useElapsedSeconds(entry);

  if (!entry) return null;
  const paused = entry.pausedAt !== null;

  return (
    <div className="fixed bottom-6 right-6 z-40 hidden md:block">
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-lg">
        <Link href="/timer" className="flex flex-col">
          <span className="text-xs font-medium text-muted-foreground">
            {entry.title}
          </span>
          <span className="font-mono text-lg font-semibold tabular-nums">
            {formatDurationClock(elapsed)}
          </span>
        </Link>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={pending}
            onClick={() => (paused ? resume() : pause())}
            className="flex size-8 items-center justify-center rounded-full bg-secondary text-secondary-foreground hover:opacity-80 disabled:opacity-50"
            aria-label={paused ? "Continuar" : "Pausar"}
          >
            {paused ? <Play className="size-4" /> : <Pause className="size-4" />}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => finish()}
            className={cn(
              "flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50",
            )}
            aria-label="Finalizar"
          >
            <Square className="size-3.5 fill-current" />
          </button>
        </div>
      </div>
    </div>
  );
}
