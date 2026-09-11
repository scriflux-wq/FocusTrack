"use client";

import { useState, useTransition } from "react";
import { NotebookPen, FolderKanban } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CategoryDot } from "@/components/ui/category-badge";
import { useOrganize } from "@/components/providers/organize-provider";
import { useTimerStore } from "@/lib/timer/use-timer-store";
import { updateEntry } from "@/lib/actions/time-entries";

/** Lets you re-categorize or annotate the timer while it's still running. */
export function TimerMetadataEditor() {
  const entry = useTimerStore((s) => s.activeEntry);
  const patchActive = useTimerStore((s) => s.patchActive);
  const { categories, subcategories } = useOrganize();
  const [note, setNote] = useState("");
  const [, startTransition] = useTransition();

  if (!entry) return null;
  const activeEntry = entry;

  function handleCategoryChange(value: string | null) {
    if (!value || value === "none") return;
    const categoryId = value;
    const category = categories.find((c) => c.id === categoryId);
    patchActive({
      categoryId,
      categoryName: category?.name ?? null,
      categoryColor: category?.color ?? null,
    });
    startTransition(async () => {
      try {
        await updateEntry({ id: activeEntry.id, categoryId });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "No se pudo guardar");
      }
    });
  }

  function handleNoteBlur() {
    if (!note) return;
    startTransition(async () => {
      try {
        await updateEntry({ id: activeEntry.id, notes: note });
        toast.success("Nota guardada");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "No se pudo guardar");
      }
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-border bg-card p-4">
      <p className="text-sm font-semibold">Log This Timer</p>

      <div className="flex items-center gap-3 rounded-xl bg-secondary/50 px-3 py-2">
        <FolderKanban className="size-4 text-muted-foreground" />
        <div className="flex-1">
          <p className="text-[11px] text-muted-foreground">Category</p>
          <Select value={entry.categoryId ?? "none"} onValueChange={handleCategoryChange}>
            <SelectTrigger className="h-auto w-full border-none bg-transparent p-0 text-sm font-medium shadow-none">
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
      </div>

      {entry.subcategoryId && (
        <div className="flex items-center gap-3 rounded-xl bg-secondary/50 px-3 py-2">
          <FolderKanban className="size-4 text-muted-foreground" />
          <div className="flex-1">
            <p className="text-[11px] text-muted-foreground">Subcategoría</p>
            <p className="text-sm font-medium">
              {subcategories.find((s) => s.id === entry.subcategoryId)?.name ?? "—"}
            </p>
          </div>
        </div>
      )}

      <div className="flex items-start gap-3 rounded-xl bg-secondary/50 px-3 py-2">
        <NotebookPen className="mt-1 size-4 shrink-0 text-muted-foreground" />
        <div className="flex-1">
          <p className="mb-1 text-[11px] text-muted-foreground">Note</p>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onBlur={handleNoteBlur}
            placeholder="Add a quick note…"
            rows={2}
            className="w-full resize-none border-none bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
          />
        </div>
      </div>
    </div>
  );
}
