/**
 * Dependency-free calendar maths. All functions work on local calendar dates
 * (year/month/day) and normalise times to local midnight, so DST transitions
 * never shift a day.
 */

export type DateRange = { start: Date | null; end: Date | null };

/** Returns a new Date at local midnight for the same calendar day. */
export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function createDate(year: number, monthIndex: number, day: number): Date {
  const d = new Date(year, monthIndex, day);
  // Guard years < 100, which the Date constructor maps to 19xx.
  if (year >= 0 && year < 100) d.setFullYear(year);
  return d;
}

export function addDays(date: Date, amount: number): Date {
  return createDate(date.getFullYear(), date.getMonth(), date.getDate() + amount);
}

export function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

/** Adds months, clamping the day to the end of the target month (Jan 31 + 1 → Feb 28/29). */
export function addMonths(date: Date, amount: number): Date {
  const total = date.getFullYear() * 12 + date.getMonth() + amount;
  const year = Math.floor(total / 12);
  const month = ((total % 12) + 12) % 12;
  const day = Math.min(date.getDate(), daysInMonth(year, month));
  return createDate(year, month, day);
}

export function addYears(date: Date, amount: number): Date {
  return addMonths(date, amount * 12);
}

export function startOfMonth(date: Date): Date {
  return createDate(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date: Date): Date {
  return createDate(
    date.getFullYear(),
    date.getMonth(),
    daysInMonth(date.getFullYear(), date.getMonth()),
  );
}

/** Start of the week containing `date`; `weekStartsOn` 0 = Sunday … 6 = Saturday. */
export function startOfWeek(date: Date, weekStartsOn = 1): Date {
  const diff = (date.getDay() - weekStartsOn + 7) % 7;
  return addDays(startOfDay(date), -diff);
}

export function endOfWeek(date: Date, weekStartsOn = 1): Date {
  return addDays(startOfWeek(date, weekStartsOn), 6);
}

export function isSameDay(a: Date | null | undefined, b: Date | null | undefined): boolean {
  return (
    !!a &&
    !!b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

/** Compares calendar days: negative if a < b, 0 if same day, positive if a > b. */
export function compareDays(a: Date, b: Date): number {
  return (
    (a.getFullYear() - b.getFullYear()) * 10000 +
    (a.getMonth() - b.getMonth()) * 100 +
    (a.getDate() - b.getDate())
  );
}

export function isBefore(a: Date, b: Date): boolean {
  return compareDays(a, b) < 0;
}

export function isAfter(a: Date, b: Date): boolean {
  return compareDays(a, b) > 0;
}

/** Inclusive range check on calendar days. Order of start/end does not matter. */
export function isWithinRange(
  date: Date,
  start: Date | null | undefined,
  end: Date | null | undefined,
): boolean {
  if (!start || !end) return false;
  const [lo, hi] = compareDays(start, end) <= 0 ? [start, end] : [end, start];
  return compareDays(date, lo) >= 0 && compareDays(date, hi) <= 0;
}

export function clampDate(date: Date, min?: Date | null, max?: Date | null): Date {
  if (min && isBefore(date, min)) return startOfDay(min);
  if (max && isAfter(date, max)) return startOfDay(max);
  return date;
}

/** Number of whole calendar days from a to b. */
export function differenceInDays(a: Date, b: Date): number {
  const ua = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const ub = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((ua - ub) / 86400000);
}

/**
 * Weeks covering the month, each a 7-day array starting on `weekStartsOn`.
 * Always 6 rows when `fixedWeeks` is true so the grid height never jumps.
 */
export function getMonthGrid(month: Date, weekStartsOn = 1, fixedWeeks = true): Date[][] {
  const first = startOfMonth(month);
  const last = endOfMonth(month);
  let cursor = startOfWeek(first, weekStartsOn);
  const weeks: Date[][] = [];
  while (compareDays(cursor, last) <= 0 || (fixedWeeks && weeks.length < 6)) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(cursor);
      cursor = addDays(cursor, 1);
    }
    weeks.push(week);
  }
  return weeks;
}

const pad = (n: number, len = 2) => String(Math.abs(n)).padStart(len, '0');

/** Formats a date as `yyyy-mm-dd` using its local calendar day. */
export function toISODate(date: Date): string {
  return `${pad(date.getFullYear(), 4)}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Parses `yyyy-mm-dd` into a local date. Returns null for malformed or impossible dates. */
export function parseISODate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]) - 1, Number(m[3])];
  if (mo < 0 || mo > 11 || d < 1 || d > daysInMonth(y, mo)) return null;
  return createDate(y, mo, d);
}

/**
 * Lenient parsing for typed input: ISO `yyyy-mm-dd`, or numeric day/month/year
 * in the locale's order (e.g. `31/01/2026` for en-GB, `01/31/2026` for en-US).
 */
export function parseDateInput(value: string, locale?: string): Date | null {
  const iso = parseISODate(value);
  if (iso) return iso;
  const parts = value
    .trim()
    .split(/[\s./-]+/)
    .filter(Boolean);
  if (parts.length !== 3 || parts.some((p) => !/^\d+$/.test(p))) return null;
  const order = getDateFieldOrder(locale);
  const lookup: Record<string, number> = {};
  order.forEach((field, i) => (lookup[field] = Number(parts[i])));
  let year = lookup.year!;
  if (parts[order.indexOf('year')]!.length <= 2) year += 2000;
  const month = lookup.month! - 1;
  const day = lookup.day!;
  if (month < 0 || month > 11 || day < 1 || day > daysInMonth(year, month)) return null;
  return createDate(year, month, day);
}

/** The order of day/month/year fields for a locale, via Intl. */
export function getDateFieldOrder(locale?: string): ('day' | 'month' | 'year')[] {
  try {
    const parts = new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date(2026, 10, 23));
    const order = parts
      .map((p) => p.type)
      .filter((t): t is 'day' | 'month' | 'year' => t === 'day' || t === 'month' || t === 'year');
    return order.length === 3 ? order : ['day', 'month', 'year'];
  } catch {
    return ['day', 'month', 'year'];
  }
}

/** Short weekday names starting at `weekStartsOn`. */
export function getWeekdayNames(
  locale?: string,
  weekStartsOn = 1,
  style: 'narrow' | 'short' | 'long' = 'short',
): string[] {
  const fmt = new Intl.DateTimeFormat(locale, { weekday: style });
  // 2026-11-01 is a Sunday.
  return Array.from({ length: 7 }, (_, i) =>
    fmt.format(createDate(2026, 10, 1 + ((weekStartsOn + i) % 7))),
  );
}

export function formatDate(
  date: Date,
  locale?: string,
  options: Intl.DateTimeFormatOptions = { dateStyle: 'medium' },
): string {
  return new Intl.DateTimeFormat(locale, options).format(date);
}

export function getMonthNames(locale?: string, style: 'long' | 'short' = 'long'): string[] {
  const fmt = new Intl.DateTimeFormat(locale, { month: style });
  return Array.from({ length: 12 }, (_, i) => fmt.format(createDate(2026, i, 1)));
}
