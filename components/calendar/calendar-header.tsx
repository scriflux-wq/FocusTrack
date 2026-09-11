"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type CalendarView = "day" | "3day" | "week" | "month";

export function CalendarHeader({
  view,
  dateISO,
  label,
}: {
  view: CalendarView;
  dateISO: string;
  label: string;
}) {
  const router = useRouter();

  function go(nextView: CalendarView, nextDateISO: string) {
    router.push(`/calendar?view=${nextView}&date=${nextDateISO}`);
  }

  /** Local calendar date — toISOString() would report the UTC day and jump a day after midnight. */
  function localISO(d: Date) {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  function shift(days: number) {
    const d = new Date(dateISO + "T12:00:00");
    d.setDate(d.getDate() + days);
    go(view, localISO(d));
  }

  const stepDays = view === "day" ? 1 : view === "3day" ? 3 : view === "week" ? 7 : 30;

  return (
    <div className="flex shrink-0 flex-col gap-2 sm:gap-3">
      <div className="flex items-center justify-between gap-2">
        <h1 className="truncate font-serif text-base font-semibold capitalize sm:text-lg">{label}</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => shift(-stepDays)} aria-label="Anterior">
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => shift(stepDays)} aria-label="Siguiente">
            <ChevronRight className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => go(view, localISO(new Date()))}
          >
            Hoy
          </Button>
        </div>
      </div>

      <Tabs value={view} onValueChange={(v) => go(v as CalendarView, dateISO)}>
        <TabsList className="h-9 w-full rounded-full bg-secondary p-1 sm:h-10">
          <TabsTrigger value="day" className="rounded-full data-active:rounded-full">
            Día
          </TabsTrigger>
          <TabsTrigger value="3day" className="rounded-full data-active:rounded-full">
            3 días
          </TabsTrigger>
          <TabsTrigger value="week" className="rounded-full data-active:rounded-full">
            Semana
          </TabsTrigger>
          <TabsTrigger value="month" className="rounded-full data-active:rounded-full">
            Mes
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}
