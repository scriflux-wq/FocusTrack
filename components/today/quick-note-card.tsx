"use client";

import { useEffect, useState } from "react";
import { NotebookPen } from "lucide-react";

const STORAGE_KEY = "focustrack:quick-note";

export function QuickNoteCard() {
  const [note, setNote] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      // One-shot client-only read (needs `localStorage`, unavailable during SSR).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNote(localStorage.getItem(STORAGE_KEY) ?? "");
    } catch {
      // localStorage unavailable (private mode, etc.) — note just won't persist.
    }
    setLoaded(true);
  }, []);

  function handleChange(value: string) {
    setNote(value);
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // ignore
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-3xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <NotebookPen className="size-4 text-muted-foreground" />
        Quick Note
      </div>
      <textarea
        value={loaded ? note : ""}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Jot something down…"
        rows={3}
        className="w-full resize-none rounded-xl border border-transparent bg-secondary/50 p-2.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-border"
      />
    </div>
  );
}
