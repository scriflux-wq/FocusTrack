"use client";

import { useState } from "react";
import { Plus, ChevronRight } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { CategoryDot } from "@/components/ui/category-badge";
import { useOrganize } from "@/components/providers/organize-provider";
import { CategoryFormSheet } from "./category-form-sheet";
import { ProjectFormSheet } from "./project-form-sheet";
import type { Category, Project } from "@/lib/db/schema";

export function OrganizeView() {
  const { categories, projects, tags } = useOrganize();
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectFormOpen, setProjectFormOpen] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Organize</h1>

      <Tabs defaultValue="categories">
        <TabsList>
          <TabsTrigger value="categories">Categorías</TabsTrigger>
          <TabsTrigger value="projects">Proyectos</TabsTrigger>
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

        <TabsContent value="projects" className="flex flex-col gap-3 pt-4">
          <Button
            variant="outline"
            className="self-start"
            onClick={() => {
              setEditingProject(null);
              setProjectFormOpen(true);
            }}
          >
            <Plus className="size-4" />
            Nuevo proyecto
          </Button>
          <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
            {projects.map((p) => {
              const category = categories.find((c) => c.id === p.categoryId);
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProject(p);
                      setProjectFormOpen(true);
                    }}
                    className="flex w-full items-center gap-3 px-4 py-3 hover:bg-secondary/60"
                  >
                    <CategoryDot color={p.color} className="size-3" />
                    <span className="flex-1 text-left">
                      <span className="font-medium">{p.name}</span>
                      {category && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          {category.name}
                        </span>
                      )}
                    </span>
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </button>
                </li>
              );
            })}
            {projects.length === 0 && (
              <li className="p-6 text-center text-sm text-muted-foreground">
                Sin proyectos todavía.
              </li>
            )}
          </ul>
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
      <ProjectFormSheet
        open={projectFormOpen}
        onOpenChange={setProjectFormOpen}
        project={editingProject ?? undefined}
      />
    </div>
  );
}
