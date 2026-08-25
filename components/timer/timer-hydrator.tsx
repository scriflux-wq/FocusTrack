"use client";

import { useEffect } from "react";
import { useTimerStore, type ActiveTimerEntry } from "@/lib/timer/use-timer-store";

/** Seeds the client timer store with the server-fetched active entry once. */
export function TimerHydrator({ initial }: { initial: ActiveTimerEntry | null }) {
  const setActiveEntry = useTimerStore((s) => s.setActiveEntry);

  useEffect(() => {
    setActiveEntry(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial?.id]);

  return null;
}
