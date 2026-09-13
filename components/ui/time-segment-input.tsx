"use client";

import { forwardRef, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const COMMIT_PAUSE_MS = 900;

/**
 * A single two-digit segment (hour or minute) you type into directly instead
 * of hunting through a dropdown list — type "11", or just "9" for a value
 * that can't take a second digit (e.g. hour 9, minute 6) and it commits
 * immediately. Matches how macOS/iOS date fields work.
 *
 * Driven by `onChange`, not `onKeyDown`: virtual keyboards on phones don't
 * reliably fire keydown with a usable `.key` for every tap, but `onChange`
 * always fires. The field must also stay genuinely editable — an early
 * version made it `readOnly` to fully own the rendered text, which works
 * fine with a physical keyboard but silently stops iOS/Android from showing
 * a keyboard at all for a read-only field, so nothing could be typed on
 * mobile. Select-all-on-focus does the same job without that cost: the
 * first digit typed replaces the whole selection natively, the second
 * appends after it, and the pending digit is tracked in a ref (not just
 * state) so the blur `onComplete` triggers when advancing to the next
 * segment sees "nothing pending" immediately rather than the pre-update
 * value — otherwise it would re-commit a stale single digit over the value
 * just typed (typing "11" landing as "01").
 */
export const TimeSegmentInput = forwardRef<
  HTMLInputElement,
  {
    value: number;
    max: number;
    onChange: (v: number) => void;
    /** Called once a value is fully typed, so focus can move to the next segment. */
    onComplete?: () => void;
    "aria-label": string;
    className?: string;
  }
>(function TimeSegmentInput(
  { value, max, onChange, onComplete, "aria-label": ariaLabel, className },
  ref,
) {
  const [display, setDisplay] = useState<string | null>(null);
  const pendingRef = useRef<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => clearScheduled(), []);

  function clearScheduled() {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }

  function setPending(text: string | null) {
    pendingRef.current = text;
    setDisplay(text);
  }

  function commitValue(text: string, advance: boolean) {
    clearScheduled();
    setPending(null);
    onChange(Math.min(Number(text.slice(-2)), max));
    if (advance) onComplete?.();
  }

  function scheduleCommit(text: string) {
    clearScheduled();
    timeoutRef.current = setTimeout(() => commitValue(text, false), COMMIT_PAUSE_MS);
  }

  return (
    <input
      ref={ref}
      aria-label={ariaLabel}
      inputMode="numeric"
      pattern="[0-9]*"
      autoComplete="off"
      value={display ?? String(value).padStart(2, "0")}
      onFocus={(e) => e.currentTarget.select()}
      onBlur={() => {
        if (pendingRef.current !== null) commitValue(pendingRef.current, false);
      }}
      onChange={(e) => {
        const next = e.target.value.replace(/\D/g, "").slice(-2);
        if (next === "") {
          setPending(null);
          clearScheduled();
          return;
        }
        // A second digit could still follow (e.g. "1" -> maybe "11"..."19")
        // only if the tens value it implies still fits under `max`;
        // otherwise this digit is already the whole answer (hour "9").
        const canTakeAnotherDigit = next.length === 1 && Number(next) * 10 <= max;
        if (next.length >= 2 || !canTakeAnotherDigit) {
          commitValue(next, true);
        } else {
          setPending(next);
          scheduleCommit(next);
        }
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowUp") {
          e.preventDefault();
          onChange(((value + 1) % (max + 1) + (max + 1)) % (max + 1));
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          onChange(((value - 1) % (max + 1) + (max + 1)) % (max + 1));
        } else if (e.key === "Escape") {
          e.preventDefault();
          setPending(null);
          clearScheduled();
        }
      }}
      className={cn(
        "w-8 cursor-text rounded-md bg-transparent text-center tabular-nums outline-none focus-visible:bg-primary/10",
        className,
      )}
    />
  );
});
