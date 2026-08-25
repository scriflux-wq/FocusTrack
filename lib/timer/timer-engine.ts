/**
 * Pure timer math. Elapsed time is always derived from real timestamps
 * (startTime / pausedAt / totalPausedSeconds), never from an incrementing
 * counter, so a page reload or closed tab never loses accuracy.
 */

export type TimerState = {
  startTime: Date;
  pausedAt: Date | null;
  totalPausedSeconds: number;
};

export function isPaused(entry: Pick<TimerState, "pausedAt">): boolean {
  return entry.pausedAt !== null;
}

/** Seconds elapsed on a still-running (or paused) timer, as of `now`. */
export function computeElapsedSeconds(entry: TimerState, now: Date): number {
  const rawElapsed = (now.getTime() - entry.startTime.getTime()) / 1000;
  const pausedExtra = entry.pausedAt
    ? (now.getTime() - entry.pausedAt.getTime()) / 1000
    : 0;
  const elapsed = rawElapsed - entry.totalPausedSeconds - pausedExtra;
  return Math.max(0, Math.floor(elapsed));
}

/** totalPausedSeconds to persist after resuming a paused timer. */
export function computeResumedPausedSeconds(
  entry: Pick<TimerState, "pausedAt" | "totalPausedSeconds">,
  now: Date,
): number {
  if (!entry.pausedAt) return entry.totalPausedSeconds;
  const pausedFor = (now.getTime() - entry.pausedAt.getTime()) / 1000;
  return entry.totalPausedSeconds + Math.max(0, Math.floor(pausedFor));
}

/** Final duration to persist when finishing a running timer. */
export function computeFinishedDurationSeconds(
  entry: TimerState,
  endTime: Date,
): number {
  return computeElapsedSeconds(entry, endTime);
}

/** "1h 15m" / "45m" style, for cards, history, stats. */
export function formatDurationShort(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h === 0 && m === 0) return "0m";
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m.toString().padStart(2, "0")}m`;
}

/** "01:32:47" style, for the live timer display. */
export function formatDurationClock(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((v) => v.toString().padStart(2, "0")).join(":");
}
