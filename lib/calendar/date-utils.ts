import { toZonedTime, fromZonedTime, format as formatTz } from "date-fns-tz";
import {
  startOfDay,
  addDays,
  startOfWeek,
  startOfMonth,
  endOfMonth,
} from "date-fns";
import { es } from "date-fns/locale";

export type DateRange = { start: Date; end: Date };

/** [start, end) UTC instants spanning the local calendar day at `reference` in `tz`. */
export function getDayRange(reference: Date, tz: string): DateRange {
  const zonedStart = startOfDay(toZonedTime(reference, tz));
  return {
    start: fromZonedTime(zonedStart, tz),
    end: fromZonedTime(addDays(zonedStart, 1), tz),
  };
}

export function getRangeForDays(reference: Date, tz: string, days: number): DateRange {
  const { start } = getDayRange(reference, tz);
  return { start, end: addDays(start, days) };
}

/** weekStartsOn: 0=Sunday..6=Saturday, per user settings. */
export function getWeekRange(
  reference: Date,
  tz: string,
  weekStartsOn: number,
): DateRange {
  const zonedWeekStart = startOfWeek(toZonedTime(reference, tz), {
    weekStartsOn: weekStartsOn as 0 | 1 | 2 | 3 | 4 | 5 | 6,
  });
  const start = fromZonedTime(startOfDay(zonedWeekStart), tz);
  return { start, end: addDays(start, 7) };
}

export function getMonthRange(reference: Date, tz: string): DateRange {
  const zoned = toZonedTime(reference, tz);
  const zonedStart = startOfDay(startOfMonth(zoned));
  const zonedEnd = startOfDay(addDays(endOfMonth(zoned), 1));
  return {
    start: fromZonedTime(zonedStart, tz),
    end: fromZonedTime(zonedEnd, tz),
  };
}

export function formatTime(date: Date, tz: string, timeFormat: string): string {
  return formatTz(date, timeFormat === "12h" ? "h:mm a" : "HH:mm", {
    timeZone: tz,
  });
}

/** Never treat time after `now` as elapsed — used to keep "untracked time" from counting the future. */
export function capToNow(date: Date, now: Date): Date {
  return date.getTime() > now.getTime() ? now : date;
}

export function formatDayLabel(date: Date, tz: string): string {
  return formatTz(date, "EEEE, d MMM", { timeZone: tz, locale: es });
}
