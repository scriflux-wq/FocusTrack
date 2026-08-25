"use client";

import { useState } from "react";
import Link from "next/link";
import { Pause, Play, Square, Target } from "lucide-react";
import { useTimerStore } from "@/lib/timer/use-timer-store";
import { useElapsedSeconds } from "@/lib/timer/use-elapsed";
import { formatDurationClock, formatDurationShort } from "@/lib/timer/timer-engine";
import { EntryFormSheet } from "@/components/entries/entry-form-sheet";
import { Button } from "@/components/ui/button";

export function HeroCard({
  trackedTodaySeconds,
  dailyGoalMinutes,
}: {
  trackedTodaySeconds: number;
  dailyGoalMinutes: number | null;
}) {
  const entry = useTimerStore((s) => s.activeEntry);
  const pending = useTimerStore((s) => s.pending);
  const pause = useTimerStore((s) => s.pause);
  const resume = useTimerStore((s) => s.resume);
  const finish = useTimerStore((s) => s.finish);
  const elapsed = useElapsedSeconds(entry);
  const [startOpen, setStartOpen] = useState(false);

  const liveTotal = trackedTodaySeconds + (entry ? elapsed : 0);
  const goalSeconds = dailyGoalMinutes ? dailyGoalMinutes * 60 : null;
  const percent = goalSeconds ? Math.min(100, Math.round((liveTotal / goalSeconds) * 100)) : null;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-primary p-6 text-primary-foreground">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-4xl font-semibold tabular-nums">
            {formatDurationShort(liveTotal)}
          </p>
          <p className="mt-1 text-sm text-primary-foreground/75">
            {percent !== null
              ? `${percent}% de tu objetivo de ${formatDurationShort(goalSeconds!)}`
              : "registrado hoy"}
          </p>
        </div>

        {entry ? (
          <div className="flex items-center gap-4 rounded-2xl bg-white/10 px-4 py-3">
            <Link href="/timer" className="flex flex-col">
              <span className="flex items-center gap-1.5 text-xs font-medium text-primary-foreground/75">
                <Target className="size-3" />
                {entry.title}
              </span>
              <span className="font-mono text-2xl font-semibold tabular-nums">
                {formatDurationClock(elapsed)}
              </span>
            </Link>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={pending}
                onClick={() => (entry.pausedAt ? resume() : pause())}
                className="flex size-9 items-center justify-center rounded-full bg-white/20 hover:bg-white/30 disabled:opacity-50"
                aria-label={entry.pausedAt ? "Continuar" : "Pausar"}
              >
                {entry.pausedAt ? <Play className="size-4" /> : <Pause className="size-4" />}
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => finish()}
                className="flex size-9 items-center justify-center rounded-full bg-white text-primary hover:opacity-90 disabled:opacity-50"
                aria-label="Finalizar"
              >
                <Square className="size-3.5 fill-current" />
              </button>
            </div>
          </div>
        ) : (
          <Button
            onClick={() => setStartOpen(true)}
            variant="secondary"
            className="w-full bg-white text-primary hover:bg-white/90 sm:w-auto"
          >
            <Play className="size-4 fill-current" />
            Iniciar timer
          </Button>
        )}
      </div>

      <EntryFormSheet open={startOpen} onOpenChange={setStartOpen} mode="timer" />
    </div>
  );
}
