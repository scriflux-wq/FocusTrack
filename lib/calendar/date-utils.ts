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

/**
 * Adds whole calendar days in `tz`. Plain millisecond arithmetic drifts by an
 * hour across a DST boundary, which is enough to land the result on the
 * previous day at 23:00.
 */
export function addZonedDays(date: Date, tz: string, days: number): Date {
  return fromZonedTime(addDays(toZonedTime(date, tz), days), tz);
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

/**
 * Renders `date` as wall-clock time in `tz`.
 *
 * date-fns-tz's `format` does NOT convert the instant: its `timeZone` option
 * only feeds the timezone-name tokens, so the value is rendered with the host's
 * local offset. The instant must be shifted with `toZonedTime` first. Skipping
 * that step makes output correct only when the host happens to run in `tz` —
 * it rendered fine locally but shifted a whole day on the UTC production server.
 */
export function formatInZone(date: Date, tz: string, pattern: string): string {
  return formatTz(toZonedTime(date, tz), pattern, { timeZone: tz, locale: es });
}

export function formatTime(date: Date, tz: string, timeFormat: string): string {
  return formatInZone(date, tz, timeFormat === "12h" ? "h:mm a" : "HH:mm");
}

/** Never treat time after `now` as elapsed — used to keep "untracked time" from counting the future. */
export function capToNow(date: Date, now: Date): Date {
  return date.getTime() > now.getTime() ? now : date;
}

export function formatDayLabel(date: Date, tz: string): string {
  return formatInZone(date, tz, "EEEE, d MMM");
}

/** Local calendar day at `date` in `tz`, as "yyyy-MM-dd". */
export function toDateISO(date: Date, tz: string): string {
  return formatInZone(date, tz, "yyyy-MM-dd");
}
