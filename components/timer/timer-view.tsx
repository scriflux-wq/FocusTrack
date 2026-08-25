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

export function TimerView() {
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
        <div className="flex items-center gap-3">
          <ControlButton
            label="Stop"
            icon={X}
            onClick={() => discard()}
            disabled={pending}
            className="bg-destructive/10 text-destructive"
          />
          <ControlButton
            label={paused ? "Continuar" : "Pausa"}
            icon={paused ? Play : Pause}
            onClick={() => (paused ? resume() : pause())}
            disabled={pending}
            className="bg-secondary text-secondary-foreground"
          />
          <ControlButton
            label="Finish"
            icon={Flag}
            onClick={() => finish()}
            disabled={pending}
            className="bg-primary text-primary-foreground"
          />
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

function ControlButton({
  label,
  icon: Icon,
  onClick,
  disabled,
  className,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex flex-col items-center gap-1.5 disabled:opacity-50"
    >
      <span className={`flex size-14 items-center justify-center rounded-2xl ${className}`}>
        <Icon className="size-5" />
      </span>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
    </button>
  );
}
