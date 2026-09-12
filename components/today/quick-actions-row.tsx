"use client";

import { useState } from "react";
import { Play, PencilLine, BarChart3 } from "lucide-react";
import { EntryFormSheet } from "@/components/entries/entry-form-sheet";
import { categoryColor, categorySoftColor } from "@/lib/categories";

type SheetState = { mode: "timer" | "manual"; start?: Date; end?: Date } | null;

const ACTIONS = [
  { key: "timer", label: "Start Timer", sub: "Registra tu tiempo", icon: Play, color: "cat-projects" },
  { key: "log", label: "Log Activity", sub: "Añade lo que hiciste", icon: PencilLine, color: "cat-learning" },
  { key: "gaps", label: "Review Gaps", sub: "Revisa lo que falta", icon: BarChart3, color: "cat-work" },
] as const;

function lastHalfHour() {
  const end = new Date();
  return { start: new Date(end.getTime() - 30 * 60 * 1000), end };
}

export function QuickActionsRow({ onReviewGaps }: { onReviewGaps: () => void }) {
  const [sheet, setSheet] = useState<SheetState>(null);

  function handleClick(key: (typeof ACTIONS)[number]["key"]) {
    if (key === "timer") return setSheet({ mode: "timer" });
    if (key === "gaps") return onReviewGaps();
    // "log": just-finished activity, defaults to the last 30 minutes.
    const { start, end } = lastHalfHour();
    return setSheet({ mode: "manual", start, end });
  }

  return (
    <div className="grid grid-cols-3 gap-2.5">
      {ACTIONS.map((action) => (
        <button
          key={action.key}
          type="button"
          onClick={() => handleClick(action.key)}
          className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card py-4 hover:bg-secondary/60"
        >
          <span
            className="flex size-10 items-center justify-center rounded-full"
            style={{ backgroundColor: categorySoftColor(action.color), color: categoryColor(action.color) }}
          >
            <action.icon className="size-4.5" />
          </span>
          <span className="text-center">
            <span className="block text-[12px] font-semibold leading-tight text-foreground">
              {action.label}
            </span>
            <span className="block text-[10px] leading-tight text-muted-foreground">
              {action.sub}
            </span>
          </span>
        </button>
      ))}

      {sheet && (
        <EntryFormSheet
          open={Boolean(sheet)}
          onOpenChange={(o) => !o && setSheet(null)}
          mode={sheet.mode}
          defaultStart={sheet.start}
          defaultEnd={sheet.end}
        />
      )}
    </div>
  );
}
