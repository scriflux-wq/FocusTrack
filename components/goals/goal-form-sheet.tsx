"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ResponsiveSheet } from "@/components/ui/responsive-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CategoryDot } from "@/components/ui/category-badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createGoal } from "@/lib/actions/goals";
import { useOrganize } from "@/components/providers/organize-provider";

type Scope = "category" | "project" | "activity" | "overall";

export function GoalFormSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { categories, projects } = useOrganize();
  const [name, setName] = useState("");
  const [scope, setScope] = useState<Scope>("category");
  const [scopeId, setScopeId] = useState("");
  const [activityName, setActivityName] = useState("");
  const [targetAmount, setTargetAmount] = useState("5");
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [goalType, setGoalType] = useState<"hours" | "sessions">("hours");
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    startTransition(async () => {
      try {
        await createGoal({
          name,
          categoryId: scope === "category" ? scopeId : null,
          projectId: scope === "project" ? scopeId : null,
          activityName: scope === "activity" ? activityName : null,
          targetAmount:
            goalType === "hours" ? Number(targetAmount) * 60 : Number(targetAmount),
          period,
          goalType,
        });
        toast.success("Objetivo creado");
        onOpenChange(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Algo salió mal");
      }
    });
  }

  return (
    <ResponsiveSheet open={open} onOpenChange={onOpenChange} title="Nuevo objetivo">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="goal-name">Nombre</Label>
          <Input
            id="goal-name"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Gimnasio, Holandés…"
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Aplica a</Label>
          <Select value={scope} onValueChange={(v) => setScope(v as Scope)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="category">Una categoría</SelectItem>
              <SelectItem value="project">Un proyecto</SelectItem>
              <SelectItem value="activity">Una actividad concreta</SelectItem>
              <SelectItem value="overall">Tiempo total del día</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {scope === "category" && (
          <Select value={scopeId} onValueChange={(v) => setScopeId(v ?? "")}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Elige categoría" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  <CategoryDot color={c.color} />
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {scope === "project" && (
          <Select value={scopeId} onValueChange={(v) => setScopeId(v ?? "")}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Elige proyecto" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  <CategoryDot color={p.color} />
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {scope === "activity" && (
          <Input
            value={activityName}
            onChange={(e) => setActivityName(e.target.value)}
            placeholder="Nombre exacto de la actividad"
            required
          />
        )}

        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="goal-amount">
              {goalType === "hours" ? "Horas" : "Sesiones"}
            </Label>
            <Input
              id="goal-amount"
              type="number"
              min={1}
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Tipo</Label>
            <Select value={goalType} onValueChange={(v) => setGoalType(v as typeof goalType)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hours">Horas</SelectItem>
                <SelectItem value="sessions">Sesiones</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Periodo</Label>
            <Select value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Diario</SelectItem>
                <SelectItem value="weekly">Semanal</SelectItem>
                <SelectItem value="monthly">Mensual</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button type="submit" disabled={pending} className="mt-1">
          Crear objetivo
        </Button>
      </form>
    </ResponsiveSheet>
  );
}
