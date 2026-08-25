"use client";

import { useSyncExternalStore } from "react";

let cached: Date | null = null;

function getSnapshot() {
  return cached;
}

function getServerSnapshot() {
  return null;
}

function subscribe(callback: () => void) {
  function tick() {
    cached = new Date();
    callback();
  }
  tick(); // refresh immediately on mount, not just on the next 60s boundary
  const id = setInterval(tick, 60000);
  return () => clearInterval(id);
}

/** The current time, refreshed every minute. Null during SSR/first paint to avoid hydration mismatches. */
export function useNow(): Date | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
