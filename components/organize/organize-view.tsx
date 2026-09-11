"use client";

import { useState } from "react";
import { Plus, ChevronRight, Sparkle } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { CategoryDot } from "@/components/ui/category-badge";
import { useOrganize } from "@/components/providers/organize-provider";
import { CategoryFormSheet } from "./category-form-sheet";
import { SubcategoryFormSheet } from "./subcategory-form-sheet";
import type { Category, Subcategory } from "@/lib/db/schema";

export function OrganizeView() {
  const { categories, subcategories, tags } = useOrganize();
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null);
  const [subcategoryFormOpen, setSubcategoryFormOpen] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="flex items-center gap-2 font-serif text-2xl font-semibold">
        <Sparkle className="size-4 text-primary" />
        Organize
      </h1>

      <Tabs defaultValue="categories">
        <TabsList>
          <TabsTrigger value="categories">Categorías</TabsTrigger>
          <TabsTrigger value="subcategories">Subcategorías</TabsTrigger>
          <TabsTrigger value="tags">Etiquetas</TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="flex flex-col gap-3 pt-4">
          <Button
            variant="outline"
            className="self-start"
            onClick={() => {
              setEditingCategory(null);
              setCategoryFormOpen(true);
            }}
          >
            <Plus className="size-4" />
            Nueva categoría
          </Button>
          <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
            {categories.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => {
                    setEditingCategory(c);
                    setCategoryFormOpen(true);
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 hover:bg-secondary/60"
                >
                  <CategoryDot color={c.color} className="size-3" />
                  <span className="flex-1 text-left font-medium">{c.name}</span>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </button>
              </li>
            ))}
            {categories.length === 0 && (
              <li className="p-6 text-center text-sm text-muted-foreground">
                Sin categorías todavía.
              </li>
            )}
          </ul>
        </TabsContent>

        <TabsContent value="subcategories" className="flex flex-col gap-3 pt-4">
          <p className="text-sm text-muted-foreground">
            Nivel opcional dentro de una categoría — por ejemplo Trabajo →
            McDonalds. Solo si quieres más detalle.
          </p>
          <Button
            variant="outline"
            className="self-start"
            onClick={() => {
              setEditingSubcategory(null);
              setSubcategoryFormOpen(true);
            }}
            disabled={categories.length === 0}
          >
            <Plus className="size-4" />
            Nueva subcategoría
          </Button>
          <div className="flex flex-col gap-4">
            {categories.map((category) => {
              const children = subcategories.filter((s) => s.categoryId === category.id);
              if (children.length === 0) return null;
              return (
                <div key={category.id} className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 px-1">
                    <CategoryDot color={category.color} className="size-2.5" />
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {category.name}
                    </span>
                  </div>
                  <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
                    {children.map((sub) => (
                      <li key={sub.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingSubcategory(sub);
                            setSubcategoryFormOpen(true);
                          }}
                          className="flex w-full items-center gap-3 px-4 py-3 hover:bg-secondary/60"
                        >
                          <CategoryDot color={category.color} className="size-3" />
                          <span className="flex-1 text-left font-medium">{sub.name}</span>
                          <ChevronRight className="size-4 text-muted-foreground" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
            {subcategories.length === 0 && (
              <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                Sin subcategorías. No hacen falta: son totalmente opcionales.
              </p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="tags" className="flex flex-col gap-3 pt-4">
          <p className="text-sm text-muted-foreground">
            Las etiquetas se crean directamente al registrar una sesión (en
            &quot;Más opciones&quot;).
          </p>
          <div className="flex flex-wrap gap-2">
            {tags.map((t) => (
              <span
                key={t.id}
                className="rounded-full bg-secondary px-3 py-1 text-sm"
              >
                {t.name}
              </span>
            ))}
            {tags.length === 0 && (
              <p className="text-sm text-muted-foreground">Sin etiquetas todavía.</p>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <CategoryFormSheet
        open={categoryFormOpen}
        onOpenChange={setCategoryFormOpen}
        category={editingCategory ?? undefined}
      />
      <SubcategoryFormSheet
        open={subcategoryFormOpen}
        onOpenChange={setSubcategoryFormOpen}
        subcategory={editingSubcategory ?? undefined}
      />
    </div>
  );
}
