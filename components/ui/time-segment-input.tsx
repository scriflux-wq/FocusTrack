"use client";

import { forwardRef, useState } from "react";
import { cn } from "@/lib/utils";

function clamp(n: number, max: number) {
  return ((n % (max + 1)) + (max + 1)) % (max + 1);
}

/**
 * A single two-digit segment (hour or minute) you type into directly instead
 * of hunting through a dropdown list — type "14", press Tab/→ to move on, or
 * use the arrow keys to nudge by one. Matches how macOS/iOS date fields work,
 * which is the fastest way to enter a specific time by far.
 */
export const TimeSegmentInput = forwardRef<
  HTMLInputElement,
  {
    value: number;
    max: number;
    onChange: (v: number) => void;
    /** Called once two digits have been typed, so focus can move to the next segment. */
    onComplete?: () => void;
    "aria-label": string;
    className?: string;
  }
>(function TimeSegmentInput(
  { value, max, onChange, onComplete, "aria-label": ariaLabel, className },
  ref,
) {
  const [draft, setDraft] = useState<string | null>(null);

  function commit(text: string) {
    if (text === "") return;
    onChange(clamp(Number(text), max));
  }

  return (
    <input
      ref={ref}
      aria-label={ariaLabel}
      inputMode="numeric"
      value={draft ?? String(value).padStart(2, "0")}
      onFocus={(e) => {
        setDraft("");
        e.currentTarget.select();
      }}
      onBlur={() => {
        if (draft !== null) commit(draft);
        setDraft(null);
      }}
      onChange={(e) => {
        const digits = e.target.value.replace(/\D/g, "").slice(-2);
        setDraft(digits);
        if (digits.length === 2) {
          commit(digits);
          setDraft(null);
          onComplete?.();
        }
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowUp") {
          e.preventDefault();
          onChange(clamp(value + 1, max));
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          onChange(clamp(value - 1, max));
        }
      }}
      className={cn(
        "w-8 rounded-md bg-transparent text-center tabular-nums outline-none focus-visible:bg-primary/10",
        className,
      )}
    />
  );
});
