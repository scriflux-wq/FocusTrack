"use client";

import { createContext, useCallback, useContext, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

type Ctx = { isPending: boolean; navigate: (href: string) => void };
const CalendarTransitionContext = createContext<Ctx | null>(null);

/**
 * Navigating the calendar (prev/next day, switching views, picking a date)
 * only ever changes `?view=`/`?date=` on the same page — there's no reason
 * it should look like leaving and coming back. Every trigger goes through
 * `navigate()` here instead of `router.push()` directly, wrapped in
 * `startTransition` so React keeps the previous grid on screen (still fully
 * interactive) instead of dropping to the Suspense fallback while the next
 * one streams in. `isPending` drives a subtle fade via `CalendarPendingFade`
 * so a slow network still gives some feedback.
 */
export function CalendarTransitionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const navigate = useCallback(
    (href: string) => {
      startTransition(() => {
        router.push(href);
      });
    },
    [router],
  );

  return (
    <CalendarTransitionContext.Provider value={{ isPending, navigate }}>
      {children}
    </CalendarTransitionContext.Provider>
  );
}

export function useCalendarNavigation() {
  const ctx = useContext(CalendarTransitionContext);
  if (!ctx) {
    throw new Error("useCalendarNavigation must be used within CalendarTransitionProvider");
  }
  return ctx;
}

export function CalendarPendingFade({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { isPending } = useCalendarNavigation();
  return (
    <div className={cn("transition-opacity duration-150", isPending && "opacity-60", className)}>
      {children}
    </div>
  );
}
