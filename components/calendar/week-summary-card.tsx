import { BarChart3 } from "lucide-react";
import { formatDurationShort } from "@/lib/timer/timer-engine";

export function WeekSummaryCard({
  trackedSeconds,
  untrackedSeconds,
  goalMinutes,
}: {
  trackedSeconds: number;
  untrackedSeconds: number;
  goalMinutes: number | null;
}) {
  const goalSeconds = goalMinutes ? goalMinutes * 60 : null;
  const goalPercent = goalSeconds ? Math.round((trackedSeconds / goalSeconds) * 100) : null;

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
        <BarChart3 className="size-4" />
      </span>
      <div className="grid flex-1 grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-sm font-semibold tabular-nums">
            {formatDurationShort(trackedSeconds)}
          </p>
          <p className="text-[11px] text-muted-foreground">Registradas</p>
        </div>
        <div className="border-x border-border">
          <p className="text-sm font-semibold tabular-nums">
            {formatDurationShort(untrackedSeconds)}
          </p>
          <p className="text-[11px] text-muted-foreground">Sin registrar</p>
        </div>
        <div>
          <p className="text-sm font-semibold tabular-nums">
            {goalPercent !== null ? `${goalPercent}%` : "—"}
          </p>
          <p className="text-[11px] text-muted-foreground">Objetivo semanal</p>
        </div>
      </div>
    </div>
  );
}
