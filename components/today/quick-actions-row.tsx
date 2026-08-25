"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Play, PencilLine, CalendarDays } from "lucide-react";
import { EntryFormSheet } from "@/components/entries/entry-form-sheet";

type SheetState = { mode: "timer" | "manual"; start?: Date; end?: Date } | null;

const ACTIONS = [
  { key: "timer", label: "Start Timer", icon: Play, color: "cat-projects" },
  { key: "log", label: "Log Activity", icon: PencilLine, color: "cat-learning" },
  { key: "week", label: "Plan Week", icon: CalendarDays, color: "cat-health" },
] as const;

function lastHalfHour() {
  const end = new Date();
  return { start: new Date(end.getTime() - 30 * 60 * 1000), end };
}

export function QuickActionsRow() {
  const router = useRouter();
  const [sheet, setSheet] = useState<SheetState>(null);

  function handleClick(key: (typeof ACTIONS)[number]["key"]) {
    if (key === "timer") return setSheet({ mode: "timer" });
    if (key === "week") return router.push("/calendar?view=week");
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
          className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card py-3.5 hover:bg-secondary/60"
        >
          <span
            className="flex size-10 items-center justify-center rounded-2xl"
            style={{ backgroundColor: `var(--${action.color}-soft)`, color: `var(--${action.color})` }}
          >
            <action.icon className="size-4.5" />
          </span>
          <span className="text-center text-[11px] font-medium leading-tight text-foreground">
            {action.label}
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
