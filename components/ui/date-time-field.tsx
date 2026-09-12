"use client";

import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarDays } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));

/**
 * Local date + time picker replacing the browser's `datetime-local` control:
 * a month grid plus hour/minute selects in one popover. Works in the browser's
 * local zone, like the native input it replaces.
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
  const hour = String(value.getHours()).padStart(2, "0");
  const minute = String(value.getMinutes()).padStart(2, "0");
  // Keep an odd minute (22:42) selectable when editing rather than snapping it.
  const minuteOptions = MINUTES.includes(minute) ? MINUTES : [...MINUTES, minute].sort();

  function setDate(day: Date | undefined) {
    if (!day) return;
    const next = new Date(value);
    next.setFullYear(day.getFullYear(), day.getMonth(), day.getDate());
    onChange(next);
  }

  function setTime(h: string, m: string) {
    const next = new Date(value);
    next.setHours(Number(h), Number(m), 0, 0);
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
        <span className="tabular-nums text-muted-foreground">
          {hour}:{minute}
        </span>
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
        <div className="flex items-center gap-2 border-t border-border px-1 pt-2">
          <span className="flex-1 text-xs text-muted-foreground">Hora</span>
          <Select
            value={hour}
            onValueChange={(h) => setTime(h ?? hour, minute)}
            items={HOURS.map((h) => ({ value: h, label: h }))}
          >
            <SelectTrigger size="sm" className="w-18 tabular-nums">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-56">
              {HOURS.map((h) => (
                <SelectItem key={h} value={h}>
                  {h}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-muted-foreground">:</span>
          <Select
            value={minute}
            onValueChange={(m) => setTime(hour, m ?? minute)}
            items={minuteOptions.map((m) => ({ value: m, label: m }))}
          >
            <SelectTrigger size="sm" className="w-18 tabular-nums">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-56">
              {minuteOptions.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </PopoverContent>
    </Popover>
  );
}
