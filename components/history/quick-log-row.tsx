"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CategoryDot } from "@/components/ui/category-badge";
import { useOrganize } from "@/components/providers/organize-provider";
import { createManualEntry } from "@/lib/actions/time-entries";

function toLocalInputValue(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function QuickLogRow() {
  const { categories } = useOrganize();
  const now = new Date();
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [start, setStart] = useState(toLocalInputValue(new Date(now.getTime() - 30 * 60000)));
  const [end, setEnd] = useState(toLocalInputValue(now));
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !categoryId) return;
    startTransition(async () => {
      try {
        await createManualEntry({
          title,
          categoryId,
          startTime: new Date(start),
          endTime: new Date(end),
        });
        setTitle("");
        toast.success("Actividad registrada");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "No se pudo guardar");
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-2 rounded-3xl border border-border bg-card p-4 sm:flex-row sm:items-end"
    >
      <div className="flex-1">
        <label className="mb-1 block text-[11px] text-muted-foreground">Activity</label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Deep Work"
          required
        />
      </div>
      <div className="sm:w-40">
        <label className="mb-1 block text-[11px] text-muted-foreground">Categoría</label>
        <Select value={categoryId} onValueChange={(v) => setCategoryId(v ?? "")}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Categoría" />
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
      </div>
      <div>
        <label className="mb-1 block text-[11px] text-muted-foreground">Start</label>
        <Input
          type="datetime-local"
          value={start}
          onChange={(e) => setStart(e.target.value)}
          className="w-auto"
        />
      </div>
      <div>
        <label className="mb-1 block text-[11px] text-muted-foreground">End</label>
        <Input
          type="datetime-local"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
          className="w-auto"
        />
      </div>
      <Button type="submit" disabled={pending} className="rounded-full">
        Save
      </Button>
    </form>
  );
}
