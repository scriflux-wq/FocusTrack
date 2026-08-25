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
import { CATEGORY_COLOR_OPTIONS } from "@/lib/categories";
import { createProject, updateProject, archiveProject } from "@/lib/actions/organize";
import { useOrganize } from "@/components/providers/organize-provider";
import type { Project } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

export function ProjectFormSheet({
  open,
  onOpenChange,
  project,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: Project;
}) {
  const { categories } = useOrganize();
  const [name, setName] = useState(project?.name ?? "");
  const [color, setColor] = useState(project?.color ?? "cat-projects");
  const [categoryId, setCategoryId] = useState<string | null>(
    project?.categoryId ?? null,
  );
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    startTransition(async () => {
      try {
        if (project) {
          await updateProject(project.id, { name, color, categoryId });
          toast.success("Proyecto actualizado");
        } else {
          await createProject({ name, color, categoryId });
          toast.success("Proyecto creado");
        }
        onOpenChange(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Algo salió mal");
      }
    });
  }

  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={onOpenChange}
      title={project ? "Editar proyecto" : "Nuevo proyecto"}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="proj-name">Nombre</Label>
          <Input
            id="proj-name"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Mario Perfume, Scriflux…"
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Categoría (opcional)</Label>
          <Select
            value={categoryId ?? "none"}
            onValueChange={(v) => setCategoryId(v === "none" ? null : v)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Sin categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sin categoría</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  <CategoryDot color={c.color} />
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Color</Label>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_COLOR_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setColor(opt.value)}
                className={cn(
                  "flex size-9 items-center justify-center rounded-full border-2",
                  color === opt.value ? "border-foreground" : "border-transparent",
                )}
                aria-label={opt.label}
              >
                <CategoryDot color={opt.value} className="size-5" />
              </button>
            ))}
          </div>
        </div>
        <div className="mt-1 flex items-center gap-2">
          {project && (
            <Button
              type="button"
              variant="ghost"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await archiveProject(project.id);
                  toast.success("Proyecto archivado");
                  onOpenChange(false);
                })
              }
              className="text-destructive hover:text-destructive"
            >
              Archivar
            </Button>
          )}
          <Button type="submit" disabled={pending} className="flex-1">
            Guardar
          </Button>
        </div>
      </form>
    </ResponsiveSheet>
  );
}
