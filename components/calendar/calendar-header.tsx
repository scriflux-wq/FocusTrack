"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCalendarNavigation } from "./calendar-transition";

export type CalendarView = "day" | "3day" | "week" | "month";

const VIEWS: CalendarView[] = ["day", "3day", "week", "month"];

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
  const { navigate, isPending } = useCalendarNavigation();

  function href(nextView: CalendarView, nextDateISO: string) {
    return `/calendar?view=${nextView}&date=${nextDateISO}`;
  }

  /** Local calendar date — toISOString() would report the UTC day and jump a day after midnight. */
  function localISO(d: Date) {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  function shiftedISO(days: number) {
    const d = new Date(dateISO + "T12:00:00");
    d.setDate(d.getDate() + days);
    return localISO(d);
  }

  const stepDays = view === "day" ? 1 : view === "3day" ? 3 : view === "week" ? 7 : 30;
  const prevHref = href(view, shiftedISO(-stepDays));
  const nextHref = href(view, shiftedISO(stepDays));
  const todayHref = href(view, localISO(new Date()));

  // The handful of places a click almost always goes next: warm them as soon
  // as this header renders so the actual click has nothing left to wait on.
  useEffect(() => {
    router.prefetch(prevHref);
    router.prefetch(nextHref);
    router.prefetch(todayHref);
    for (const v of VIEWS) {
      if (v !== view) router.prefetch(href(v, dateISO));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prevHref, nextHref, todayHref, view, dateISO]);

  return (
    <div className="flex shrink-0 flex-col gap-2 sm:gap-3">
      <div className="flex items-center justify-between gap-2">
        <h1
          className="truncate font-serif text-base font-semibold capitalize transition-opacity sm:text-lg"
          style={{ opacity: isPending ? 0.6 : 1 }}
        >
          {label}
        </h1>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-full border border-border bg-card">
            <button
              type="button"
              onClick={() => navigate(prevHref)}
              aria-label="Anterior"
              className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <ChevronLeft className="size-4" />
            </button>
            <CalendarDays className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <button
              type="button"
              onClick={() => navigate(nextHref)}
              aria-label="Siguiente"
              className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
          <Button variant="outline" size="sm" className="rounded-full" onClick={() => navigate(todayHref)}>
            Hoy
          </Button>
        </div>
      </div>

      <Tabs value={view} onValueChange={(v) => navigate(href(v as CalendarView, dateISO))}>
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
