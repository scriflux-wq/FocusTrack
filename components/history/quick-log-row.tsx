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
import { DateTimeField } from "@/components/ui/date-time-field";
import { createManualEntry } from "@/lib/actions/time-entries";

export function QuickLogRow() {
  const { categories } = useOrganize();
  const now = new Date();
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [start, setStart] = useState<Date>(() => new Date(now.getTime() - 30 * 60000));
  const [end, setEnd] = useState<Date>(() => now);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !categoryId) return;
    startTransition(async () => {
      try {
        await createManualEntry({
          title,
          categoryId,
          startTime: start,
          endTime: end,
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
        <Select
          value={categoryId}
          onValueChange={(v) => setCategoryId(v ?? "")}
          items={categories.map((c) => ({ value: c.id, label: c.name }))}
        >
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
        <DateTimeField value={start} onChange={setStart} className="sm:w-44" />
      </div>
      <div>
        <label className="mb-1 block text-[11px] text-muted-foreground">End</label>
        <DateTimeField value={end} onChange={setEnd} className="sm:w-44" />
      </div>
      <Button type="submit" disabled={pending} className="rounded-full">
        Save
      </Button>
    </form>
  );
}
