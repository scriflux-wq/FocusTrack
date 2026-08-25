"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ResponsiveSheet } from "@/components/ui/responsive-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CategoryDot } from "@/components/ui/category-badge";
import { CATEGORY_COLOR_OPTIONS } from "@/lib/categories";
import { createCategory, updateCategory, archiveCategory } from "@/lib/actions/organize";
import type { Category } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

export function CategoryFormSheet({
  open,
  onOpenChange,
  category,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category;
}) {
  const [name, setName] = useState(category?.name ?? "");
  const [color, setColor] = useState(category?.color ?? "cat-work");
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    startTransition(async () => {
      try {
        if (category) {
          await updateCategory(category.id, { name, color });
          toast.success("Categoría actualizada");
        } else {
          await createCategory({ name, color });
          toast.success("Categoría creada");
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
      title={category ? "Editar categoría" : "Nueva categoría"}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cat-name">Nombre</Label>
          <Input
            id="cat-name"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Salud, Aprendizaje…"
            required
          />
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
          {category && (
            <Button
              type="button"
              variant="ghost"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await archiveCategory(category.id);
                  toast.success("Categoría archivada");
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
