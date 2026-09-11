"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  format,
} from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

export function MiniMonthCalendar({
  referenceDateISO,
  weekStartsOn,
}: {
  referenceDateISO: string;
  weekStartsOn: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reference = new Date(referenceDateISO + "T12:00:00");
  const today = new Date();

  const monthStart = startOfMonth(reference);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: weekStartsOn as 0 | 1 });
  const days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  const weekdayLabels = days.slice(0, 7).map((d) => format(d, "EEEEE", { locale: es }));

  function goToDay(day: Date) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("date", format(day, "yyyy-MM-dd"));
    router.push(`/calendar?${params.toString()}`);
  }

  return (
    <div className="rounded-3xl border border-border bg-card p-4">
      <p className="mb-3 text-center text-sm font-semibold capitalize">
        {format(monthStart, "MMMM yyyy", { locale: es })}
      </p>
      <div className="grid grid-cols-7 text-center text-[10px] font-medium text-muted-foreground">
        {weekdayLabels.map((label, i) => (
          <span key={i} className="py-1 uppercase">
            {label}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {days.map((day) => {
          const inMonth = isSameMonth(day, monthStart);
          const isToday = isSameDay(day, today);
          const isSelected = isSameDay(day, reference);
          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => goToDay(day)}
              className={cn(
                "mx-auto flex size-7 items-center justify-center rounded-full text-xs transition-colors",
                !inMonth && "text-muted-foreground/40",
                inMonth && !isSelected && "text-foreground hover:bg-secondary",
                isSelected && "bg-primary text-primary-foreground font-semibold",
                !isSelected && isToday && "ring-1 ring-primary text-primary font-semibold",
              )}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
