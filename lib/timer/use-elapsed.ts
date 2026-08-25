"use client";

import { useEffect, useState } from "react";
import { computeElapsedSeconds, type TimerState } from "@/lib/timer/timer-engine";

/** Ticks once a second while the timer is running; frozen while paused. */
export function useElapsedSeconds(entry: TimerState | null): number {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!entry || entry.pausedAt) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [entry?.pausedAt, entry?.startTime]);

  if (!entry) return 0;
  return computeElapsedSeconds(entry, new Date());
}
