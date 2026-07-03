/**
 * NY County Supreme Court (Criminal Term) term calendar pattern.
 *
 * Terms run as 13 four-week blocks per year (13 × 28 = 364 days) on a Monday
 * grid: each term begins on its grid Monday and spans 28 days. When the grid
 * Monday is a court holiday, sitting begins Tuesday — but the grid itself
 * does not shift, so the following term still starts four weeks after the
 * previous grid Monday.
 */

const pad = (n: number) => String(n).padStart(2, '0');

export const toDateStr = (d: Date): string =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Noon-anchored local date to avoid DST edge cases in date arithmetic. */
const at = (y: number, m: number, d: number) => new Date(y, m - 1, d, 12);

/** nth occurrence of a weekday (0=Sun..6=Sat) in a month, e.g. 3rd Monday. */
function nthWeekday(year: number, month: number, weekday: number, n: number): Date {
  const first = at(year, month, 1);
  const offset = (weekday - first.getDay() + 7) % 7;
  return at(year, month, 1 + offset + (n - 1) * 7);
}

/** Last occurrence of a weekday in a month, e.g. last Monday of May. */
function lastWeekday(year: number, month: number, weekday: number): Date {
  const last = at(year, month + 1, 0); // day 0 of next month = last day of this one
  const offset = (last.getDay() - weekday + 7) % 7;
  return at(year, month, last.getDate() - offset);
}

/** Fixed-date holiday with weekend observance: Sat → Fri, Sun → Mon. */
function observedFixed(year: number, month: number, day: number): Date {
  const d = at(year, month, day);
  if (d.getDay() === 6) d.setDate(d.getDate() - 1);
  if (d.getDay() === 0) d.setDate(d.getDate() + 1);
  return d;
}

/** NYS Unified Court System holidays (observed dates) for a given year. */
export function nysCourtHolidays(year: number): string[] {
  const firstMondayNov = nthWeekday(year, 11, 1, 1);
  const electionDay = new Date(firstMondayNov);
  electionDay.setDate(firstMondayNov.getDate() + 1); // first Tuesday after first Monday

  return [
    observedFixed(year, 1, 1),    // New Year's Day
    nthWeekday(year, 1, 1, 3),    // Martin Luther King Jr. Day
    observedFixed(year, 2, 12),   // Lincoln's Birthday
    nthWeekday(year, 2, 1, 3),    // Washington's Birthday
    lastWeekday(year, 5, 1),      // Memorial Day
    observedFixed(year, 6, 19),   // Juneteenth
    observedFixed(year, 7, 4),    // Independence Day
    nthWeekday(year, 9, 1, 1),    // Labor Day
    nthWeekday(year, 10, 1, 2),   // Columbus Day
    electionDay,                  // Election Day
    observedFixed(year, 11, 11),  // Veterans Day
    nthWeekday(year, 11, 4, 4),   // Thanksgiving Day
    observedFixed(year, 12, 25),  // Christmas Day
  ].map(toDateStr);
}

export function isCourtHoliday(dateStr: string): boolean {
  return nysCourtHolidays(Number(dateStr.slice(0, 4))).includes(dateStr);
}

/**
 * Dates for the term block that follows `prevEnd` (or, with no usable
 * previous term, the block beginning on the next Monday from today).
 * The end date stays on the 28-day grid even when the start shifts to
 * Tuesday for a holiday.
 */
export function nextTermDates(prevEnd?: string | null): { start: string; end: string } {
  const from = prevEnd ? new Date(prevEnd + 'T12:00:00') : new Date();
  from.setHours(12, 0, 0, 0);
  if (prevEnd) from.setDate(from.getDate() + 1);

  const gridMonday = new Date(from);
  gridMonday.setDate(from.getDate() + ((8 - from.getDay()) % 7)); // snap forward to Monday

  const end = new Date(gridMonday);
  end.setDate(gridMonday.getDate() + 27); // 28-day block, inclusive

  const start = new Date(gridMonday);
  if (isCourtHoliday(toDateStr(start))) start.setDate(start.getDate() + 1); // holiday Monday → Tuesday

  return { start: toDateStr(start), end: toDateStr(end) };
}

// ── Sitting days ("calendar parts") ─────────────────────────────────────────

export const SITTING_DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const;

const DAY_ABBREV: Record<string, string> = {
  Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu', Friday: 'Fri',
};

/** Parse a stored calendar_day value ("Thursday,Tuesday") into ordered day names. */
export function parseSittingDays(value: string | null | undefined): string[] {
  if (!value) return [];
  const days = value.split(',').map(s => s.trim()).filter(Boolean);
  return SITTING_DAY_ORDER.filter(d => days.includes(d));
}

/** Compact display form, weekday-ordered: "Tue/Thu". */
export function formatSittingDays(value: string | null | undefined): string {
  return parseSittingDays(value).map(d => DAY_ABBREV[d] ?? d.slice(0, 3)).join('/');
}
