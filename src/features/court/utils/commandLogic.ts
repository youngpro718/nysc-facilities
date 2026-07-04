/**
 * Pure helpers for the Court Officer command dashboard.
 */
import { parseSittingDays } from "./termPattern";

export interface OverdueCheckFields {
  returned_at: string | null;
  expected_return_at: string | null;
}

/** A key assignment is overdue when it is unreturned past its expected return. */
export function isOverdueAssignment(a: OverdueCheckFields, now: Date = new Date()): boolean {
  if (a.returned_at || !a.expected_return_at) return false;
  return new Date(a.expected_return_at).getTime() < now.getTime();
}

/** Long weekday name in local time, e.g. "Friday". */
export function weekdayName(d: Date = new Date()): string {
  return d.toLocaleDateString("en-US", { weekday: "long" });
}

/**
 * Whether a part sits on the given weekday. Parts without a calendar_day
 * schedule sit every court day; nothing sits on weekends.
 */
export function sitsOnDay(calendarDay: string | null | undefined, day: string): boolean {
  if (day === "Saturday" || day === "Sunday") return false;
  const days = parseSittingDays(calendarDay);
  return days.length === 0 || days.includes(day);
}
