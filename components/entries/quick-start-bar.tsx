"use client";

import { useState } from "react";
import { Play, Plus } from "lucide-react";
import { toast } from "sonner";
import { CategoryDot } from "@/components/ui/category-badge";
import { EntryFormSheet } from "./entry-form-sheet";
import { useTimerStore } from "@/lib/timer/use-timer-store";

export type RecentActivity = {
  title: string;
  categoryId: string | null;
  projectId: string | null;
  categoryColor: string | null;
};

export function QuickStartBar({ recent }: { recent: RecentActivity[] }) {
  const activeEntry = useTimerStore((s) => s.activeEntry);
  const start = useTimerStore((s) => s.start);
  const [formOpen, setFormOpen] = useState(false);
  const [startingTitle, setStartingTitle] = useState<string | null>(null);

  async function quickStart(activity: RecentActivity) {
    if (activeEntry) {
      toast.error("Ya hay una sesión en marcha. Finalízala primero.");
      return;
    }
    setStartingTitle(activity.title);
    try {
      await start({
        title: activity.title,
        categoryId: activity.categoryId,
        projectId: activity.projectId,
      });
      toast.success(`Timer iniciado: ${activity.title}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo iniciar");
    } finally {
      setStartingTitle(null);
    }
  }

  return (
    <div className="flex flex-col gap-2.5">
      <h2 className="text-sm font-semibold">Inicio rápido</h2>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
        {recent.map((activity) => (
          <button
            key={activity.title}
            type="button"
            disabled={startingTitle !== null}
            onClick={() => quickStart(activity)}
            className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-border bg-card py-1.5 pl-3 pr-2 text-sm font-medium transition-colors hover:bg-secondary disabled:opacity-50"
          >
            {activity.categoryColor && <CategoryDot color={activity.categoryColor} />}
            {activity.title}
            <span className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Play className="size-2.5 fill-current" />
            </span>
          </button>
        ))}
        <button
          type="button"
          onClick={() => setFormOpen(true)}
          className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-dashed border-border py-1.5 px-3 text-sm font-medium text-muted-foreground hover:bg-secondary"
        >
          <Plus className="size-4" />
          Nueva
        </button>
      </div>

      <EntryFormSheet open={formOpen} onOpenChange={setFormOpen} mode="timer" />
    </div>
  );
}
