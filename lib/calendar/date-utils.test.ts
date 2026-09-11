import { describe, it, expect } from "vitest";
import {
  formatInZone,
  toDateISO,
  getDayRange,
  getWeekRange,
  addZonedDays,
} from "./date-utils";

const TZ = "Europe/Madrid";
/** Friday 11 September 2026, 21:40 in Madrid (CEST, UTC+2). */
const FRIDAY_NIGHT = new Date("2026-09-11T19:40:00Z");
/** Saturday 00:30 in Madrid — still Friday in UTC. */
const PAST_MIDNIGHT = new Date("2026-09-11T22:30:00Z");

describe("host timezone independence", () => {
  it("runs with a UTC host, matching production", () => {
    // Guards the tests below: under a Madrid host they would pass either way.
    expect(new Date().getTimezoneOffset()).toBe(0);
  });

  it("formats the zone's wall-clock day, not the host's", () => {
    expect(formatInZone(FRIDAY_NIGHT, TZ, "EEEE d")).toBe("viernes 11");
    expect(formatInZone(FRIDAY_NIGHT, TZ, "HH:mm")).toBe("21:40");
  });

  it("keeps local midnight on the right calendar day", () => {
    // 00:00 Madrid on the 12th is 22:00 UTC on the 11th; rendering that instant
    // with the host offset reports the 11th.
    const saturdayStart = getDayRange(PAST_MIDNIGHT, TZ).start;
    expect(formatInZone(saturdayStart, TZ, "EEEE d")).toBe("sábado 12");
    expect(toDateISO(saturdayStart, TZ)).toBe("2026-09-12");
  });
});

describe("week grid", () => {
  it("builds Monday-first columns labelled for the right days", () => {
    const start = getWeekRange(FRIDAY_NIGHT, TZ, 1).start;
    const labels = Array.from({ length: 7 }, (_, i) =>
      formatInZone(addZonedDays(start, TZ, i), TZ, "EEE d"),
    );
    expect(labels).toEqual([
      "lun 7",
      "mar 8",
      "mié 9",
      "jue 10",
      "vie 11",
      "sáb 12",
      "dom 13",
    ]);
  });

  it("marks the column whose local day contains now", () => {
    const start = getWeekRange(FRIDAY_NIGHT, TZ, 1).start;
    const todayStart = getDayRange(FRIDAY_NIGHT, TZ).start.getTime();
    const index = Array.from({ length: 7 }, (_, i) =>
      addZonedDays(start, TZ, i).getTime(),
    ).indexOf(todayStart);
    expect(index).toBe(4); // Friday, the fifth column of a Monday-first week
  });

  it("labels the range with its last day, not the exclusive end", () => {
    const start = getWeekRange(FRIDAY_NIGHT, TZ, 1).start;
    const end = addZonedDays(start, TZ, 7);
    expect(formatInZone(new Date(end.getTime() - 1), TZ, "d MMM")).toBe("13 sep");
  });
});

describe("addZonedDays", () => {
  it("stays on midnight across the autumn DST change", () => {
    // Madrid goes CEST -> CET on 25 October 2026; plain 24h arithmetic would
    // land on 23:00 of the previous day.
    const oct24 = getDayRange(new Date("2026-10-24T10:00:00Z"), TZ).start;
    expect(formatInZone(addZonedDays(oct24, TZ, 1), TZ, "yyyy-MM-dd HH:mm")).toBe(
      "2026-10-25 00:00",
    );
    expect(formatInZone(addZonedDays(oct24, TZ, 2), TZ, "yyyy-MM-dd HH:mm")).toBe(
      "2026-10-26 00:00",
    );
  });
});
