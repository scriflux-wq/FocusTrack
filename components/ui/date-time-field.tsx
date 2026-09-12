"use client";

import { useRef, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarDays } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TimeSegmentInput } from "@/components/ui/time-segment-input";
import { cn } from "@/lib/utils";

/**
 * Local date + time picker replacing the browser's `datetime-local` control:
 * a month grid for the date, plus two type-directly segments for the time —
 * far faster than hunting through hour/minute dropdown lists.
 */
export function DateTimeField({
  id,
  value,
  onChange,
  className,
}: {
  id?: string;
  value: Date;
  onChange: (next: Date) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const minuteRef = useRef<HTMLInputElement>(null);

  function setDate(day: Date | undefined) {
    if (!day) return;
    const next = new Date(value);
    next.setFullYear(day.getFullYear(), day.getMonth(), day.getDate());
    onChange(next);
  }

  function setHour(h: number) {
    const next = new Date(value);
    next.setHours(h);
    onChange(next);
  }

  function setMinute(m: number) {
    const next = new Date(value);
    next.setMinutes(m);
    onChange(next);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        id={id}
        className={cn(
          "flex h-9 w-full items-center gap-2 rounded-lg border border-border bg-card px-3 text-left text-sm capitalize transition-colors hover:bg-secondary/60 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          className,
        )}
      >
        <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
        <span className="flex-1 truncate">{format(value, "EEE d MMM", { locale: es })}</span>
        <span className="tabular-nums text-muted-foreground">{format(value, "HH:mm")}</span>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-2">
        <Calendar
          mode="single"
          selected={value}
          onSelect={setDate}
          defaultMonth={value}
          locale={es}
          weekStartsOn={1}
        />
        <div className="flex items-center justify-center gap-1 border-t border-border pt-2.5 text-lg font-semibold">
          <TimeSegmentInput
            aria-label="Hora"
            value={value.getHours()}
            max={23}
            onChange={setHour}
            onComplete={() => minuteRef.current?.focus()}
          />
          <span className="text-muted-foreground">:</span>
          <TimeSegmentInput
            ref={minuteRef}
            aria-label="Minutos"
            value={value.getMinutes()}
            max={59}
            onChange={setMinute}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
