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

  function shift(days: number) {
    const d = new Date(dateISO + "T12:00:00");
    d.setDate(d.getDate() + days);
    go(view, d.toISOString().slice(0, 10));
  }

  const stepDays = view === "day" ? 1 : view === "3day" ? 3 : view === "week" ? 7 : 30;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
          onClick={() => go(view, new Date().toISOString().slice(0, 10))}
        >
          Hoy
        </Button>
        <h1 className="ml-1 text-lg font-semibold capitalize">{label}</h1>
      </div>

      <Tabs value={view} onValueChange={(v) => go(v as CalendarView, dateISO)}>
        <TabsList>
          <TabsTrigger value="day">Día</TabsTrigger>
          <TabsTrigger value="3day">3 días</TabsTrigger>
          <TabsTrigger value="week">Semana</TabsTrigger>
          <TabsTrigger value="month">Mes</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}
