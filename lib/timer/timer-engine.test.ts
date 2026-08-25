import { describe, it, expect } from "vitest";
import {
  computeElapsedSeconds,
  computeResumedPausedSeconds,
  computeFinishedDurationSeconds,
  formatDurationShort,
  formatDurationClock,
} from "./timer-engine";

describe("computeElapsedSeconds", () => {
  it("counts elapsed time for a running timer", () => {
    const start = new Date("2026-01-01T10:00:00Z");
    const now = new Date("2026-01-01T10:05:00Z");
    expect(
      computeElapsedSeconds({ startTime: start, pausedAt: null, totalPausedSeconds: 0 }, now),
    ).toBe(300);
  });

  it("subtracts previously accumulated paused time", () => {
    const start = new Date("2026-01-01T10:00:00Z");
    const now = new Date("2026-01-01T10:10:00Z");
    expect(
      computeElapsedSeconds(
        { startTime: start, pausedAt: null, totalPausedSeconds: 120 },
        now,
      ),
    ).toBe(480);
  });

  it("freezes elapsed while currently paused", () => {
    const start = new Date("2026-01-01T10:00:00Z");
    const pausedAt = new Date("2026-01-01T10:05:00Z");
    const now = new Date("2026-01-01T10:20:00Z");
    expect(
      computeElapsedSeconds(
        { startTime: start, pausedAt, totalPausedSeconds: 0 },
        now,
      ),
    ).toBe(300);
  });
});

describe("computeResumedPausedSeconds", () => {
  it("adds the just-finished pause to the running total", () => {
    const pausedAt = new Date("2026-01-01T10:00:00Z");
    const now = new Date("2026-01-01T10:02:00Z");
    expect(
      computeResumedPausedSeconds({ pausedAt, totalPausedSeconds: 60 }, now),
    ).toBe(180);
  });

  it("is a no-op if not currently paused", () => {
    const now = new Date("2026-01-01T10:02:00Z");
    expect(
      computeResumedPausedSeconds({ pausedAt: null, totalPausedSeconds: 60 }, now),
    ).toBe(60);
  });
});

describe("computeFinishedDurationSeconds", () => {
  it("matches elapsed at the finish instant", () => {
    const start = new Date("2026-01-01T10:00:00Z");
    const end = new Date("2026-01-01T11:15:00Z");
    expect(
      computeFinishedDurationSeconds(
        { startTime: start, pausedAt: null, totalPausedSeconds: 300 },
        end,
      ),
    ).toBe(4200);
  });
});

describe("formatDurationShort", () => {
  it.each([
    [0, "0m"],
    [59, "0m"],
    [60, "1m"],
    [2700, "45m"],
    [3600, "1h"],
    [4500, "1h 15m"],
    [23100, "6h 25m"],
  ])("%i seconds -> %s", (secs, expected) => {
    expect(formatDurationShort(secs)).toBe(expected);
  });
});

describe("formatDurationClock", () => {
  it("pads to HH:MM:SS", () => {
    expect(formatDurationClock(5567)).toBe("01:32:47");
    expect(formatDurationClock(0)).toBe("00:00:00");
  });
});
