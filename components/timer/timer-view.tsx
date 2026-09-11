"use client";

import { useState } from "react";
import { Pause, Play, Flag, X, Leaf } from "lucide-react";
import { useTimerStore } from "@/lib/timer/use-timer-store";
import { useElapsedSeconds } from "@/lib/timer/use-elapsed";
import { formatDurationClock } from "@/lib/timer/timer-engine";
import { formatTime } from "@/lib/calendar/date-utils";
import { CategoryDot } from "@/components/ui/category-badge";
import { EntryFormSheet } from "@/components/entries/entry-form-sheet";
import { Button } from "@/components/ui/button";
import { useOrganize } from "@/components/providers/organize-provider";

export function TimerView({
  timezone,
  timeFormat,
}: {
  timezone: string;
  timeFormat: string;
}) {
  const entry = useTimerStore((s) => s.activeEntry);
  const pending = useTimerStore((s) => s.pending);
  const pause = useTimerStore((s) => s.pause);
  const resume = useTimerStore((s) => s.resume);
  const finish = useTimerStore((s) => s.finish);
  const discard = useTimerStore((s) => s.discard);
  const elapsed = useElapsedSeconds(entry);
  const { categories, projects } = useOrganize();
  const [startOpen, setStartOpen] = useState(false);

  const category = categories.find((c) => c.id === entry?.categoryId);
  const project = projects.find((p) => p.id === entry?.projectId);
  const paused = entry?.pausedAt != null;
  const progress = entry ? Math.min(1, (elapsed % 3600) / 3600) : 0;

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <div className="relative flex size-64 items-center justify-center">
        <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
          <defs>
            <linearGradient id="timer-ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--glow-1)" />
              <stop offset="100%" stopColor="var(--primary)" />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="45" className="fill-none stroke-secondary" strokeWidth="6" />
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="url(#timer-ring-gradient)"
            className="fill-none transition-[stroke-dashoffset] duration-1000 ease-linear"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 45}
            strokeDashoffset={2 * Math.PI * 45 * (1 - progress)}
          />
        </svg>
        <div className="flex flex-col items-center gap-1.5">
          {entry && (
            <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <span
                className={`size-1.5 rounded-full ${paused ? "bg-muted-foreground" : "bg-success"}`}
              />
              {paused ? "Pausado" : "En directo"}
            </span>
          )}
          <p className="font-mono text-4xl font-bold tabular-nums">
            {formatDurationClock(elapsed)}
          </p>
          {entry && (
            <div className="flex flex-col items-center gap-1">
              <p className="text-base font-semibold">{entry.title}</p>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                {category && (
                  <span className="flex items-center gap-1">
                    <CategoryDot color={category.color} />
                    {category.name}
                  </span>
                )}
                {project && <span>· {project.name}</span>}
              </div>
            </div>
          )}
        </div>
      </div>

      {entry ? (
        <>
          <p className="flex items-center gap-1.5 font-serif text-sm italic text-muted-foreground">
            <Leaf className="size-3.5" />
            Progreso, no perfección.
          </p>

          <div className="flex w-full max-w-sm items-center gap-3">
            <Button
              variant="secondary"
              disabled={pending}
              onClick={() => (paused ? resume() : pause())}
              className="h-12 flex-1 rounded-full text-sm font-semibold"
            >
              {paused ? <Play className="size-4" /> : <Pause className="size-4" />}
              {paused ? "Continuar" : "Pause"}
            </Button>
            <Button
              disabled={pending}
              onClick={() => finish()}
              className="h-12 flex-1 rounded-full text-sm font-semibold"
            >
              <Flag className="size-4" />
              Finish
            </Button>
            <button
              type="button"
              disabled={pending}
              onClick={() => discard()}
              aria-label="Descartar"
              className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-destructive disabled:opacity-50"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="grid w-full max-w-sm grid-cols-3 rounded-2xl border border-border bg-card p-3 text-center">
            <div>
              <p className="text-[10px] uppercase text-muted-foreground">Started At</p>
              <p className="text-sm font-semibold">
                {formatTime(entry.startTime, timezone, timeFormat)}
              </p>
            </div>
            <div className="border-x border-border">
              <p className="text-[10px] uppercase text-muted-foreground">Elapsed</p>
              <p className="text-sm font-semibold tabular-nums">
                {formatDurationClock(elapsed)}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-muted-foreground">Status</p>
              <p className="text-sm font-semibold">{paused ? "Pausado" : "Activo"}</p>
            </div>
          </div>
        </>
      ) : (
        <Button size="lg" className="rounded-full px-8" onClick={() => setStartOpen(true)}>
          <Play className="size-4 fill-current" />
          Iniciar timer
        </Button>
      )}

      <EntryFormSheet open={startOpen} onOpenChange={setStartOpen} mode="timer" />
    </div>
  );
}
