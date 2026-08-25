"use client";

import { useState, useTransition } from "react";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { GoalFormSheet } from "./goal-form-sheet";
import { deactivateGoal } from "@/lib/actions/goals";
import { formatDurationShort } from "@/lib/timer/timer-engine";
import type { Goal } from "@/lib/db/schema";

const PERIOD_LABEL: Record<string, string> = {
  daily: "al día",
  weekly: "a la semana",
  monthly: "al mes",
};

export function GoalsView({
  progress,
}: {
  progress: { goal: Goal; current: number; percent: number }[];
}) {
  const [formOpen, setFormOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Goals</h1>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="size-4" />
          Nuevo objetivo
        </Button>
      </div>

      {progress.length === 0 && (
        <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Todavía no tienes objetivos. Los objetivos son opcionales — solo
          créalos para lo que quieras vigilar de cerca.
        </p>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {progress.map(({ goal, current, percent }) => (
          <div
            key={goal.id}
            className="flex flex-col gap-2.5 rounded-xl border border-border bg-card p-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium">{goal.name}</p>
                <p className="text-xs text-muted-foreground">
                  {goal.targetAmount}
                  {goal.goalType === "hours" ? " min" : " sesiones"}{" "}
                  {PERIOD_LABEL[goal.period]}
                </p>
              </div>
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    await deactivateGoal(goal.id);
                    toast.success("Objetivo eliminado");
                  })
                }
                className="text-muted-foreground hover:text-destructive"
                aria-label="Eliminar objetivo"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${percent}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {goal.goalType === "hours"
                ? formatDurationShort(current * 60)
                : `${current} sesiones`}{" "}
              de{" "}
              {goal.goalType === "hours"
                ? formatDurationShort(goal.targetAmount * 60)
                : `${goal.targetAmount} sesiones`}{" "}
              · {percent}%
            </p>
          </div>
        ))}
      </div>

      <GoalFormSheet open={formOpen} onOpenChange={setFormOpen} />
    </div>
  );
}
