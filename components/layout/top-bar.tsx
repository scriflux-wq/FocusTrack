"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus } from "lucide-react";
import { EntryFormSheet } from "@/components/entries/entry-form-sheet";

export function TopBar({ userEmail }: { userEmail: string | null }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const initial = (userEmail ?? "?").trim().charAt(0).toUpperCase();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/history?q=${encodeURIComponent(query.trim())}`);
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="mb-6 hidden items-center justify-end gap-3 md:flex">
      <form onSubmit={handleSearch} className="relative w-64">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={searchRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar actividad…"
          className="h-9 w-full rounded-full border border-border bg-card pl-9 pr-11 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md border border-border bg-secondary/70 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          ⌘K
        </kbd>
      </form>
      <button
        type="button"
        onClick={() => setCreating(true)}
        className="flex size-9 items-center justify-center rounded-full border border-border bg-card text-foreground hover:bg-secondary"
        aria-label="Nueva sesión"
      >
        <Plus className="size-4" />
      </button>
      <span className="flex size-9 items-center justify-center rounded-full bg-[linear-gradient(180deg,color-mix(in_oklch,var(--primary),white_16%),var(--primary))] text-sm font-semibold text-primary-foreground shadow-[inset_0_1px_0_0_rgba(255,255,255,0.35)]">
        {initial}
      </span>

      <EntryFormSheet open={creating} onOpenChange={setCreating} mode="manual" />
    </div>
  );
}
