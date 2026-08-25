"use client";

import { useState } from "react";
import { Pause, Play, Flag, X } from "lucide-react";
import { useTimerStore } from "@/lib/timer/use-timer-store";
import { useElapsedSeconds } from "@/lib/timer/use-elapsed";
import { formatDurationClock } from "@/lib/timer/timer-engine";
import { CategoryDot } from "@/components/ui/category-badge";
import { EntryFormSheet } from "@/components/entries/entry-form-sheet";
import { Button } from "@/components/ui/button";
import { useOrganize } from "@/components/providers/organize-provider";

export default function TimerPage() {
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
    <div className="flex flex-col items-center gap-8 py-6">
      <div className="relative flex size-72 items-center justify-center">
        <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
          <circle cx="50" cy="50" r="45" className="fill-none stroke-secondary" strokeWidth="6" />
          <circle
            cx="50"
            cy="50"
            r="45"
            className="fill-none stroke-primary transition-[stroke-dashoffset] duration-1000 ease-linear"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 45}
            strokeDashoffset={2 * Math.PI * 45 * (1 - progress)}
          />
        </svg>
        <div className="flex flex-col items-center gap-2">
          {entry && (
            <span className="flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-medium text-success">
              <span className="size-1.5 rounded-full bg-success" />
              {paused ? "En pausa" : "En marcha"}
            </span>
          )}
          <p className="font-mono text-5xl font-semibold tabular-nums">
            {formatDurationClock(elapsed)}
          </p>
          {entry && (
            <div className="flex flex-col items-center gap-1">
              <p className="text-base font-medium">{entry.title}</p>
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
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            className="size-14 rounded-full"
            disabled={pending}
            onClick={() => discard()}
            aria-label="Descartar"
          >
            <X className="size-5" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="size-16 rounded-full"
            disabled={pending}
            onClick={() => (paused ? resume() : pause())}
            aria-label={paused ? "Continuar" : "Pausar"}
          >
            {paused ? <Play className="size-6" /> : <Pause className="size-6" />}
          </Button>
          <Button
            size="icon"
            className="size-14 rounded-full"
            disabled={pending}
            onClick={() => finish()}
            aria-label="Finalizar"
          >
            <Flag className="size-5" />
          </Button>
        </div>
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
