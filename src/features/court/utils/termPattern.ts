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

/** First Monday of January — the anchor the whole year's grid hangs on. */
export function firstMondayOfJanuary(year: number): Date {
  const jan1 = at(year, 1, 1);
  return at(year, 1, 1 + ((1 - jan1.getDay() + 7) % 7));
}

export interface YearTerm {
  index: number;      // 1..13
  name: string;       // "Term I" .. "Term XIII"
  start: string;      // sitting start (grid Monday, or Tuesday when that Monday is a holiday)
  end: string;        // last covered day (Sunday of week 4; Term XIII runs to the day before next year's Term I)
  gridStart: string;  // the grid Monday, regardless of holiday shift
}

const TERM_ROMANS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII'];

/**
 * The full 13-term calendar for a year. Terms sit on a Monday grid anchored
 * to the first Monday of January: each term occupies four weeks, and the
 * next term starts on the fifth Monday. A holiday grid Monday pushes sitting
 * to Tuesday without moving the grid. Term XIII is the flexible one — it
 * runs until the day before next year's Term I so late December (and the
 * first days of January) are always covered, which gives it a fifth week in
 * the years that need it.
 */
export function generateYearTerms(year: number): YearTerm[] {
  const anchor = firstMondayOfJanuary(year);
  const nextAnchor = firstMondayOfJanuary(year + 1);

  return TERM_ROMANS.map((roman, i) => {
    const grid = new Date(anchor);
    grid.setDate(anchor.getDate() + i * 28);

    const start = new Date(grid);
    if (isCourtHoliday(toDateStr(start))) start.setDate(start.getDate() + 1);

    const end = new Date(i === 12 ? nextAnchor : grid);
    end.setDate(i === 12 ? nextAnchor.getDate() - 1 : grid.getDate() + 27);

    return {
      index: i + 1,
      name: `Term ${roman}`,
      start: toDateStr(start),
      end: toDateStr(end),
      gridStart: toDateStr(grid),
    };
  });
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
