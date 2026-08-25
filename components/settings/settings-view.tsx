"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Download, LogOut } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateSettings } from "@/lib/actions/settings";
import { signOut } from "@/lib/actions/auth";
import type { Settings } from "@/lib/db/schema";

const WEEKDAYS = [
  { value: "1", label: "Lunes" },
  { value: "0", label: "Domingo" },
];

export function SettingsView({ settings }: { settings: Settings }) {
  const [timezone, setTimezone] = useState(settings.timezone);
  const [weekStartsOn, setWeekStartsOn] = useState(String(settings.weekStartsOn));
  const [dayStartTime, setDayStartTime] = useState(settings.dayStartTime);
  const [dayEndTime, setDayEndTime] = useState(settings.dayEndTime);
  const [timeFormat, setTimeFormat] = useState(settings.timeFormat);
  const [defaultCalendarView, setDefaultCalendarView] = useState(
    settings.defaultCalendarView,
  );
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await updateSettings({
          timezone,
          weekStartsOn: Number(weekStartsOn),
          dayStartTime,
          dayEndTime,
          timeFormat: timeFormat as "24h" | "12h",
          defaultCalendarView: defaultCalendarView as
            | "day"
            | "3day"
            | "week"
            | "month",
        });
        toast.success("Ajustes guardados");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Algo salió mal");
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Settings</h1>

      <form onSubmit={handleSubmit} className="flex max-w-md flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="timezone">Zona horaria</Label>
          <Input
            id="timezone"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            placeholder="Europe/Madrid"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>La semana empieza en</Label>
          <Select value={weekStartsOn} onValueChange={(v) => setWeekStartsOn(v ?? "1")}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WEEKDAYS.map((d) => (
                <SelectItem key={d.value} value={d.value}>
                  {d.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="day-start">Inicio del día</Label>
            <Input
              id="day-start"
              type="time"
              value={dayStartTime}
              onChange={(e) => setDayStartTime(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="day-end">Fin del día</Label>
            <Input
              id="day-end"
              type="time"
              value={dayEndTime}
              onChange={(e) => setDayEndTime(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Formato de hora</Label>
          <Select value={timeFormat} onValueChange={(v) => setTimeFormat((v ?? "24h") as "24h" | "12h")}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">24 horas</SelectItem>
              <SelectItem value="12h">12 horas (AM/PM)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Vista de calendario por defecto</Label>
          <Select value={defaultCalendarView} onValueChange={(v) => setDefaultCalendarView((v ?? "week") as typeof defaultCalendarView)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Día</SelectItem>
              <SelectItem value="3day">3 días</SelectItem>
              <SelectItem value="week">Semana</SelectItem>
              <SelectItem value="month">Mes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button type="submit" disabled={pending} className="mt-1 self-start">
          Guardar cambios
        </Button>
      </form>

      <div className="flex max-w-md flex-col gap-2 border-t border-border pt-6">
        <h2 className="text-sm font-medium text-muted-foreground">Exportar datos</h2>
        <div className="flex gap-2">
          <a href="/api/export?format=csv" className={buttonVariants({ variant: "outline" })}>
            <Download className="size-4" />
            CSV
          </a>
          <a href="/api/export?format=json" className={buttonVariants({ variant: "outline" })}>
            <Download className="size-4" />
            JSON
          </a>
        </div>
      </div>

      <form action={signOut} className="max-w-md border-t border-border pt-6">
        <Button type="submit" variant="ghost" className="text-muted-foreground">
          <LogOut className="size-4" />
          Cerrar sesión
        </Button>
      </form>
    </div>
  );
}
