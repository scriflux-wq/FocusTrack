"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus } from "lucide-react";
import { EntryFormSheet } from "@/components/entries/entry-form-sheet";

export function TopBar({ userEmail }: { userEmail: string | null }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const initial = (userEmail ?? "?").trim().charAt(0).toUpperCase();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/history?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <div className="mb-6 hidden items-center justify-end gap-3 md:flex">
      <form onSubmit={handleSearch} className="relative w-64">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar actividad, proyecto…"
          className="h-9 w-full rounded-full border border-border bg-card pl-9 pr-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </form>
      <button
        type="button"
        onClick={() => setCreating(true)}
        className="flex size-9 items-center justify-center rounded-full border border-border bg-card text-foreground hover:bg-secondary"
        aria-label="Nueva sesión"
      >
        <Plus className="size-4" />
      </button>
      <span className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
        {initial}
      </span>

      <EntryFormSheet open={creating} onOpenChange={setCreating} mode="manual" />
    </div>
  );
}
