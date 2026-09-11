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
import {
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
} from "@/lib/actions/organize";
import { useOrganize } from "@/components/providers/organize-provider";
import type { Subcategory } from "@/lib/db/schema";

export function SubcategoryFormSheet({
  open,
  onOpenChange,
  subcategory,
  defaultCategoryId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subcategory?: Subcategory;
  defaultCategoryId?: string;
}) {
  const { categories } = useOrganize();
  const [name, setName] = useState(subcategory?.name ?? "");
  const [categoryId, setCategoryId] = useState(
    subcategory?.categoryId ?? defaultCategoryId ?? categories[0]?.id ?? "",
  );
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !categoryId) return;
    startTransition(async () => {
      try {
        if (subcategory) {
          await updateSubcategory(subcategory.id, { name, categoryId });
          toast.success("Subcategoría actualizada");
        } else {
          await createSubcategory({ name, categoryId });
          toast.success("Subcategoría creada");
        }
        setName("");
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
      title={subcategory ? "Editar subcategoría" : "Nueva subcategoría"}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="sub-name">Nombre</Label>
          <Input
            id="sub-name"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="McDonalds, Profesor de matemáticas…"
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Categoría</Label>
          <Select value={categoryId} onValueChange={(v) => setCategoryId(v ?? "")}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Elige una categoría" />
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
          <p className="text-xs text-muted-foreground">
            Hereda el color de su categoría.
          </p>
        </div>

        <div className="mt-1 flex items-center gap-2">
          {subcategory && (
            <Button
              type="button"
              variant="ghost"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await deleteSubcategory(subcategory.id);
                  toast.success("Subcategoría eliminada");
                  onOpenChange(false);
                })
              }
              className="text-destructive hover:text-destructive"
            >
              Eliminar
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
