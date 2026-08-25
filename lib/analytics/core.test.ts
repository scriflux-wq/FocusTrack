import { describe, it, expect } from "vitest";
import {
  getTrackedSeconds,
  getTimeByCategory,
  getUntrackedRanges,
  getLongestStreak,
  getPeriodComparison,
  getMostProductiveDay,
  type AnalyticsEntry,
} from "./core";

function entry(
  partial: Partial<AnalyticsEntry> & { startTime: Date; endTime: Date },
): AnalyticsEntry {
  return {
    id: crypto.randomUUID(),
    title: "Test",
    categoryId: null,
    projectId: null,
    durationSeconds: (partial.endTime.getTime() - partial.startTime.getTime()) / 1000,
    ...partial,
  };
}

describe("getTrackedSeconds", () => {
  it("sums durations", () => {
    const entries = [
      entry({ startTime: new Date("2026-01-01T09:00:00Z"), endTime: new Date("2026-01-01T10:00:00Z") }),
      entry({ startTime: new Date("2026-01-01T11:00:00Z"), endTime: new Date("2026-01-01T11:30:00Z") }),
    ];
    expect(getTrackedSeconds(entries)).toBe(5400);
  });
});

describe("getTimeByCategory", () => {
  it("groups by category and labels unassigned entries", () => {
    const names = new Map([["cat1", { name: "Trabajo", color: "cat-work" }]]);
    const entries = [
      entry({
        startTime: new Date("2026-01-01T09:00:00Z"),
        endTime: new Date("2026-01-01T10:00:00Z"),
        categoryId: "cat1",
      }),
      entry({ startTime: new Date("2026-01-01T11:00:00Z"), endTime: new Date("2026-01-01T11:30:00Z") }),
    ];
    const result = getTimeByCategory(entries, names);
    expect(result).toEqual([
      { key: "cat1", label: "Trabajo", seconds: 3600, color: "cat-work" },
      { key: "none", label: "Sin categoría", seconds: 1800, color: "cat-free" },
    ]);
  });
});

describe("getUntrackedRanges", () => {
  const dayStart = new Date("2026-01-01T07:00:00Z");
  const dayEnd = new Date("2026-01-01T23:00:00Z");

  it("returns the full day when there are no entries", () => {
    expect(getUntrackedRanges([], dayStart, dayEnd)).toEqual([
      { start: dayStart, end: dayEnd },
    ]);
  });

  it("finds gaps between entries and merges overlaps", () => {
    const entries = [
      entry({ startTime: new Date("2026-01-01T09:00:00Z"), endTime: new Date("2026-01-01T10:00:00Z") }),
      // overlaps the previous entry
      entry({ startTime: new Date("2026-01-01T09:30:00Z"), endTime: new Date("2026-01-01T11:00:00Z") }),
      entry({ startTime: new Date("2026-01-01T14:00:00Z"), endTime: new Date("2026-01-01T15:00:00Z") }),
    ];
    const gaps = getUntrackedRanges(entries, dayStart, dayEnd);
    expect(gaps).toEqual([
      { start: dayStart, end: new Date("2026-01-01T09:00:00Z") },
      { start: new Date("2026-01-01T11:00:00Z"), end: new Date("2026-01-01T14:00:00Z") },
      { start: new Date("2026-01-01T15:00:00Z"), end: dayEnd },
    ]);
  });

  it("clips entries that spill outside the window", () => {
    const entries = [
      entry({ startTime: new Date("2026-01-01T06:00:00Z"), endTime: new Date("2026-01-01T08:00:00Z") }),
    ];
    expect(getUntrackedRanges(entries, dayStart, dayEnd)).toEqual([
      { start: new Date("2026-01-01T08:00:00Z"), end: dayEnd },
    ]);
  });
});

describe("getLongestStreak", () => {
  it("finds the longest run of active days", () => {
    const days = [1, 1, 0, 1, 1, 1, 0].map((seconds) => ({ seconds }));
    expect(getLongestStreak(days)).toBe(3);
  });

  it("is zero when no day is active", () => {
    expect(getLongestStreak([{ seconds: 0 }, { seconds: 0 }])).toBe(0);
  });
});

describe("getMostProductiveDay", () => {
  it("picks the day with the highest total", () => {
    const days = [
      { day: "Mon", seconds: 100 },
      { day: "Tue", seconds: 500 },
      { day: "Wed", seconds: 300 },
    ];
    expect(getMostProductiveDay(days)).toEqual({ day: "Tue", seconds: 500 });
  });

  it("returns null for an empty range", () => {
    expect(getMostProductiveDay([])).toBeNull();
  });
});

describe("getPeriodComparison", () => {
  it("computes a percent increase", () => {
    expect(getPeriodComparison(115, 100)).toEqual({ deltaSeconds: 15, percent: 15 });
  });

  it("returns null percent when the previous period was zero", () => {
    expect(getPeriodComparison(50, 0)).toEqual({ deltaSeconds: 50, percent: null });
  });
});
