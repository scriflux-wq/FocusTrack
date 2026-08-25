"use client";

import { useState } from "react";
import Link from "next/link";
import { Pause, Play, Square, Target } from "lucide-react";
import { useTimerStore } from "@/lib/timer/use-timer-store";
import { useElapsedSeconds } from "@/lib/timer/use-elapsed";
import { formatDurationClock, formatDurationShort } from "@/lib/timer/timer-engine";
import { EntryFormSheet } from "@/components/entries/entry-form-sheet";
import { CategoryDot } from "@/components/ui/category-badge";

const RING_SIZE = 128;
const STROKE = 9;
const RADIUS = (RING_SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function HeroCard({ trackedTodaySeconds }: { trackedTodaySeconds: number }) {
  const entry = useTimerStore((s) => s.activeEntry);
  const pending = useTimerStore((s) => s.pending);
  const pause = useTimerStore((s) => s.pause);
  const resume = useTimerStore((s) => s.resume);
  const finish = useTimerStore((s) => s.finish);
  const elapsed = useElapsedSeconds(entry);
  const [startOpen, setStartOpen] = useState(false);

  const liveTotal = trackedTodaySeconds + (entry ? elapsed : 0);

  return (
    <div className="rounded-3xl bg-primary p-5 text-primary-foreground">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-primary-foreground/70">
          Current focus
        </span>
        <span className="flex size-7 items-center justify-center rounded-full bg-white/15">
          <Target className="size-3.5" />
        </span>
      </div>

      <div className="flex items-center gap-5">
        <div className="relative shrink-0" style={{ width: RING_SIZE, height: RING_SIZE }}>
          <svg width={RING_SIZE} height={RING_SIZE} className="-rotate-90">
            <circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RADIUS}
              strokeWidth={STROKE}
              className="fill-none stroke-white/20"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold tabular-nums">
              {formatDurationShort(liveTotal)}
            </span>
            <span className="text-[10px] text-primary-foreground/70">registrado hoy</span>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2 pt-1">
          {entry ? (
            <>
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-base font-semibold">
                  <CategoryDot color={entry.categoryColor ?? "cat-free"} className="size-2.5" />
                  <span className="min-w-0 truncate">{entry.title}</span>
                </p>
                {entry.projectName && (
                  <p className="truncate text-xs text-primary-foreground/70">
                    {entry.projectName}
                  </p>
                )}
              </div>
              <div className="flex items-center justify-between gap-2 rounded-full bg-white/15 py-1.5 pl-3 pr-1.5">
                <Link href="/timer" className="font-mono text-sm font-semibold tabular-nums">
                  {formatDurationClock(elapsed)}
                </Link>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => (entry.pausedAt ? resume() : pause())}
                    className="flex size-7 items-center justify-center rounded-full bg-white/20 hover:bg-white/30 disabled:opacity-50"
                    aria-label={entry.pausedAt ? "Continuar" : "Pausar"}
                  >
                    {entry.pausedAt ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => finish()}
                    className="flex size-7 items-center justify-center rounded-full bg-white text-primary hover:opacity-90 disabled:opacity-50"
                    aria-label="Finalizar"
                  >
                    <Square className="size-3 fill-current" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-primary-foreground/70">Nada en marcha ahora mismo</p>
              <button
                type="button"
                onClick={() => setStartOpen(true)}
                className="flex items-center justify-center gap-1.5 rounded-full bg-white py-2 text-sm font-semibold text-primary hover:bg-white/90"
              >
                <Play className="size-3.5 fill-current" />
                Iniciar timer
              </button>
            </>
          )}
        </div>
      </div>

      <EntryFormSheet open={startOpen} onOpenChange={setStartOpen} mode="timer" />
    </div>
  );
}
