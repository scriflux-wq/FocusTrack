"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { EntryFormSheet } from "@/components/entries/entry-form-sheet";

export function AddEventFab() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-28 right-5 z-30 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:opacity-90 md:bottom-8 md:right-8"
        aria-label="Nueva sesión"
      >
        <Plus className="size-5" />
      </button>
      <EntryFormSheet open={open} onOpenChange={setOpen} mode="manual" />
    </>
  );
}
