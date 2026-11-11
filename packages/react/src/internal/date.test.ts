import { describe, expect, it } from 'vitest';
import {
  addDays,
  addMonths,
  addYears,
  clampDate,
  compareDays,
  createDate,
  daysInMonth,
  differenceInDays,
  endOfMonth,
  getDateFieldOrder,
  getMonthGrid,
  getWeekdayNames,
  isSameDay,
  isWithinRange,
  parseDateInput,
  parseISODate,
  startOfMonth,
  startOfWeek,
  toISODate,
} from './date';

describe('date helpers', () => {
  it('handles month lengths and leap years', () => {
    expect(daysInMonth(2024, 1)).toBe(29);
    expect(daysInMonth(2026, 1)).toBe(28);
    expect(daysInMonth(1900, 1)).toBe(28);
    expect(daysInMonth(2000, 1)).toBe(29);
    expect(daysInMonth(2026, 11)).toBe(31);
  });

  it('adds days across month and year boundaries', () => {
    expect(toISODate(addDays(createDate(2026, 0, 31), 1))).toBe('2026-02-01');
    expect(toISODate(addDays(createDate(2026, 11, 31), 1))).toBe('2027-01-01');
    expect(toISODate(addDays(createDate(2026, 2, 1), -1))).toBe('2026-02-28');
  });

  it('adds days across DST transitions without drifting', () => {
    // Covers both EU (last Sunday of March/October) and US transitions.
    let d = createDate(2026, 2, 1);
    for (let i = 0; i < 300; i++) d = addDays(d, 1);
    expect(toISODate(d)).toBe('2026-12-26');
    expect(d.getHours()).toBe(0);
  });

  it('clamps addMonths to the end of the month', () => {
    expect(toISODate(addMonths(createDate(2026, 0, 31), 1))).toBe('2026-02-28');
    expect(toISODate(addMonths(createDate(2024, 0, 31), 1))).toBe('2024-02-29');
    expect(toISODate(addMonths(createDate(2026, 0, 15), -1))).toBe('2025-12-15');
    expect(toISODate(addMonths(createDate(2026, 2, 31), -13))).toBe('2025-02-28');
    expect(toISODate(addYears(createDate(2024, 1, 29), 1))).toBe('2025-02-28');
  });

  it('finds start/end of month and week', () => {
    expect(toISODate(startOfMonth(createDate(2026, 10, 23)))).toBe('2026-11-01');
    expect(toISODate(endOfMonth(createDate(2026, 1, 3)))).toBe('2026-02-28');
    // 2026-11-11 is a Wednesday.
    expect(toISODate(startOfWeek(createDate(2026, 10, 11), 1))).toBe('2026-11-09');
    expect(toISODate(startOfWeek(createDate(2026, 10, 11), 0))).toBe('2026-11-08');
    expect(toISODate(startOfWeek(createDate(2026, 10, 9), 1))).toBe('2026-11-09');
  });

  it('builds a fixed 6-week month grid starting on the configured weekday', () => {
    const grid = getMonthGrid(createDate(2026, 1, 1), 1);
    expect(grid).toHaveLength(6);
    expect(grid.every((w) => w.length === 7)).toBe(true);
    expect(toISODate(grid[0]![0]!)).toBe('2026-01-26');
    expect(grid[0]![0]!.getDay()).toBe(1);
    const sundayGrid = getMonthGrid(createDate(2026, 10, 1), 0, false);
    expect(toISODate(sundayGrid[0]![0]!)).toBe('2026-11-01');
    expect(sundayGrid.length).toBe(5);
  });

  it('compares and ranges calendar days', () => {
    const a = new Date(2026, 4, 10, 23, 59);
    const b = new Date(2026, 4, 10, 0, 1);
    expect(isSameDay(a, b)).toBe(true);
    expect(compareDays(a, b)).toBe(0);
    expect(isSameDay(a, null)).toBe(false);
    expect(
      isWithinRange(createDate(2026, 4, 12), createDate(2026, 4, 15), createDate(2026, 4, 10)),
    ).toBe(true);
    expect(
      isWithinRange(createDate(2026, 4, 16), createDate(2026, 4, 10), createDate(2026, 4, 15)),
    ).toBe(false);
    expect(isWithinRange(createDate(2026, 4, 10), null, createDate(2026, 4, 15))).toBe(false);
    expect(differenceInDays(createDate(2026, 2, 30), createDate(2026, 2, 28))).toBe(2);
    expect(toISODate(clampDate(createDate(2026, 0, 1), createDate(2026, 0, 5)))).toBe('2026-01-05');
  });

  it('parses and formats ISO dates strictly', () => {
    expect(toISODate(parseISODate('2024-02-29')!)).toBe('2024-02-29');
    expect(parseISODate('2026-02-29')).toBeNull();
    expect(parseISODate('2026-13-01')).toBeNull();
    expect(parseISODate('26-01-01')).toBeNull();
    expect(parseISODate('')).toBeNull();
    expect(toISODate(createDate(5, 0, 1))).toBe('0005-01-01');
  });

  it('parses typed input in locale order', () => {
    expect(getDateFieldOrder('en-US')).toEqual(['month', 'day', 'year']);
    expect(getDateFieldOrder('en-GB')).toEqual(['day', 'month', 'year']);
    expect(toISODate(parseDateInput('31/01/2026', 'en-GB')!)).toBe('2026-01-31');
    expect(toISODate(parseDateInput('01/31/2026', 'en-US')!)).toBe('2026-01-31');
    expect(toISODate(parseDateInput('5.3.26', 'de-DE')!)).toBe('2026-03-05');
    expect(parseDateInput('31/02/2026', 'en-GB')).toBeNull();
    expect(parseDateInput('tomorrow', 'en-GB')).toBeNull();
  });

  it('names weekdays from the configured start', () => {
    expect(getWeekdayNames('en-GB', 1)[0]).toBe('Mon');
    expect(getWeekdayNames('en-US', 0)[0]).toBe('Sun');
  });
});
