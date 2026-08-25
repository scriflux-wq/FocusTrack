"use client";

import { useState, useTransition } from "react";
import { ChevronDown, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ResponsiveSheet } from "@/components/ui/responsive-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CategoryDot } from "@/components/ui/category-badge";
import { useOrganize } from "@/components/providers/organize-provider";
import { useTimerStore } from "@/lib/timer/use-timer-store";
import {
  createManualEntry,
  updateEntry,
  deleteEntry,
} from "@/lib/actions/time-entries";
import type { TimeEntry } from "@/lib/db/schema";

type Mode = "timer" | "manual";

function toLocalInputValue(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function EntryFormSheet({
  open,
  onOpenChange,
  mode,
  entry,
  defaultStart,
  defaultEnd,
  defaultTitle,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: Mode;
  /** Pass to edit an existing (already-finished) entry instead of creating one. */
  entry?: TimeEntry;
  defaultStart?: Date;
  defaultEnd?: Date;
  defaultTitle?: string;
}) {
  const { categories, projects } = useOrganize();
  const startTimerAction = useTimerStore((s) => s.start);
  const [pending, startTransition] = useTransition();
  const isEdit = Boolean(entry);

  const [title, setTitle] = useState(entry?.title ?? defaultTitle ?? "");
  const [startTime, setStartTime] = useState(() =>
    toLocalInputValue(entry?.startTime ?? defaultStart ?? new Date()),
  );
  const [endTime, setEndTime] = useState(() =>
    toLocalInputValue(
      entry?.endTime ?? defaultEnd ?? new Date(Date.now() + 30 * 60 * 1000),
    ),
  );
  const [categoryId, setCategoryId] = useState<string | null>(
    entry?.categoryId ?? null,
  );
  const [projectId, setProjectId] = useState<string | null>(
    entry?.projectId ?? null,
  );
  const [notes, setNotes] = useState(entry?.notes ?? "");
  const [tagsText, setTagsText] = useState("");
  const [showMore, setShowMore] = useState(false);

  function reset() {
    setTitle("");
    setCategoryId(null);
    setProjectId(null);
    setNotes("");
    setTagsText("");
    setShowMore(false);
  }

  function tagNames() {
    return tagsText
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    startTransition(async () => {
      try {
        if (isEdit && entry) {
          await updateEntry({
            id: entry.id,
            title,
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            categoryId,
            projectId,
            notes: notes || null,
            tagNames: tagNames(),
          });
          toast.success("Sesión actualizada");
        } else if (mode === "timer") {
          await startTimerAction({
            title,
            categoryId,
            projectId,
            notes: notes || null,
            tagNames: tagNames(),
          });
          toast.success("Timer iniciado");
        } else {
          await createManualEntry({
            title,
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            categoryId,
            projectId,
            notes: notes || null,
            tagNames: tagNames(),
          });
          toast.success("Sesión guardada");
        }
        onOpenChange(false);
        reset();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Algo salió mal");
      }
    });
  }

  function handleDelete() {
    if (!entry) return;
    startTransition(async () => {
      await deleteEntry(entry.id);
      toast.success("Sesión eliminada");
      onOpenChange(false);
    });
  }

  const title_ =
    isEdit ? "Editar sesión" : mode === "timer" ? "Iniciar timer" : "Nueva sesión";

  return (
    <ResponsiveSheet open={open} onOpenChange={onOpenChange} title={title_}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="entry-title">Nombre</Label>
          <Input
            id="entry-title"
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Gimnasio, Editar vídeo, Dentista…"
            required
          />
        </div>

        {(mode === "manual" || isEdit) && (
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="entry-start">Inicio</Label>
              <Input
                id="entry-start"
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="entry-end">Fin</Label>
              <Input
                id="entry-end"
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => setShowMore((v) => !v)}
          className="flex items-center gap-1 self-start text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          Más opciones
          <ChevronDown
            className={`size-4 transition-transform ${showMore ? "rotate-180" : ""}`}
          />
        </button>

        {showMore && (
          <div className="flex flex-col gap-4 rounded-xl bg-secondary/50 p-3">
            <div className="flex flex-col gap-1.5">
              <Label>Categoría</Label>
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
              <Label>Proyecto</Label>
              <Select
                value={projectId ?? "none"}
                onValueChange={(v) => setProjectId(v === "none" ? null : v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sin proyecto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin proyecto</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      <CategoryDot color={p.color} />
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="entry-tags">Etiquetas</Label>
              <Input
                id="entry-tags"
                value={tagsText}
                onChange={(e) => setTagsText(e.target.value)}
                placeholder="YouTube, Edición (separadas por comas)"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="entry-notes">Notas</Label>
              <Textarea
                id="entry-notes"
                value={notes ?? ""}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>
        )}

        <div className="mt-1 flex items-center gap-2">
          {isEdit && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={pending}
              onClick={handleDelete}
              className="text-destructive hover:text-destructive"
              aria-label="Eliminar"
            >
              <Trash2 className="size-4" />
            </Button>
          )}
          <Button type="submit" disabled={pending} className="flex-1">
            {isEdit
              ? "Guardar cambios"
              : mode === "timer"
                ? "Iniciar"
                : "Guardar"}
          </Button>
        </div>
      </form>
    </ResponsiveSheet>
  );
}
