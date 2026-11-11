'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';
import {
  addDays,
  addMonths,
  addYears,
  clampDate,
  compareDays,
  endOfWeek,
  getMonthGrid,
  getWeekdayNames,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  isWithinRange,
  startOfDay,
  startOfMonth,
  startOfWeek,
  toISODate,
  type DateRange,
} from '../../internal/date.js';
import { useControllableState } from '../../internal/use-controllable-state.js';
import { Icon } from '../../icons/Icon.js';

export type { DateRange };

export interface CalendarLabels {
  previousMonth: string;
  nextMonth: string;
  /** Appended to today's accessible label. */
  today: string;
  selected: string;
  rangeStart: string;
  rangeEnd: string;
  unavailable: string;
}

const defaultLabels: CalendarLabels = {
  previousMonth: 'Previous month',
  nextMonth: 'Next month',
  today: 'Today',
  selected: 'Selected',
  rangeStart: 'Start of range',
  rangeEnd: 'End of range',
  unavailable: 'Unavailable',
};

interface CalendarBaseProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'defaultValue' | 'onChange'
> {
  /** The first displayed month (controlled). */
  month?: Date;
  defaultMonth?: Date;
  onMonthChange?: (month: Date) => void;
  /** Earliest selectable date. */
  min?: Date | null;
  /** Latest selectable date. */
  max?: Date | null;
  /** Return true to make a date unavailable, e.g. weekends. */
  isDateDisabled?: (date: Date) => boolean;
  /** 0 = Sunday … 6 = Saturday. Default 1 (Monday). */
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  /** BCP 47 locale for month and weekday names. Defaults to the browser locale. */
  locale?: string;
  /** Months shown side by side. Default 1. */
  numberOfMonths?: 1 | 2;
  /** Show days from adjacent months in single-month view. Default true. */
  showOutsideDays?: boolean;
  /** Override "today" (useful for tests and time zones). */
  today?: Date;
  /** Focus the active day on mount (used inside pickers). */
  autoFocus?: boolean;
  labels?: Partial<CalendarLabels>;
}

export interface CalendarSingleProps extends CalendarBaseProps {
  mode?: 'single';
  value?: Date | null;
  defaultValue?: Date | null;
  onValueChange?: (value: Date | null) => void;
}

export interface CalendarRangeProps extends CalendarBaseProps {
  mode: 'range';
  value?: DateRange;
  defaultValue?: DateRange;
  onValueChange?: (value: DateRange) => void;
}

export type CalendarProps = CalendarSingleProps | CalendarRangeProps;

const EMPTY_RANGE: DateRange = { start: null, end: null };

/** A keyboard-accessible month grid for choosing a date or a date range. */
export const Calendar = React.forwardRef<HTMLDivElement, CalendarProps>(
  function Calendar(props, ref) {
    const {
      mode = 'single',
      value: valueProp,
      defaultValue,
      onValueChange,
      month: monthProp,
      defaultMonth,
      onMonthChange,
      min,
      max,
      isDateDisabled,
      weekStartsOn = 1,
      locale,
      numberOfMonths = 1,
      showOutsideDays = true,
      today: todayProp,
      autoFocus = false,
      labels: labelsProp,
      className,
      ...rest
    } = props as CalendarBaseProps & {
      mode?: 'single' | 'range';
      value?: Date | null | DateRange;
      defaultValue?: Date | null | DateRange;
      onValueChange?: (v: never) => void;
    };
    const labels = { ...defaultLabels, ...labelsProp };
    const today = React.useMemo(() => startOfDay(todayProp ?? new Date()), [todayProp]);
    const isRange = mode === 'range';

    const [value, setValue] = useControllableState<Date | null | DateRange>({
      value: valueProp,
      defaultValue: defaultValue ?? (isRange ? EMPTY_RANGE : null),
      onChange: onValueChange as ((v: Date | null | DateRange) => void) | undefined,
    });
    const single = !isRange ? (value as Date | null) : null;
    const range = isRange ? ((value as DateRange | null) ?? EMPTY_RANGE) : EMPTY_RANGE;
    const anchor = single ?? range.start ?? today;

    const [month, setMonthState] = useControllableState<Date>({
      value: monthProp ? startOfMonth(monthProp) : undefined,
      defaultValue: startOfMonth(defaultMonth ?? clampDate(anchor, min, max)),
      onChange: onMonthChange,
    });
    const [focused, setFocused] = React.useState<Date>(() => clampDate(anchor, min, max));
    const [hovered, setHovered] = React.useState<Date | null>(null);
    const rootRef = React.useRef<HTMLDivElement>(null);
    const shouldFocus = React.useRef(autoFocus);
    const headingId = React.useId();

    const lastMonth = addMonths(month, numberOfMonths - 1);
    const isVisible = (d: Date) =>
      compareDays(d, month) >= 0 && compareDays(d, addMonths(lastMonth, 1)) < 0;

    const isDisabled = React.useCallback(
      (d: Date) =>
        (min ? isBefore(d, min) : false) ||
        (max ? isAfter(d, max) : false) ||
        !!isDateDisabled?.(d),
      [min, max, isDateDisabled],
    );

    const focusActiveDay = React.useCallback(() => {
      rootRef.current
        ?.querySelector<HTMLButtonElement>(`[data-date="${toISODate(focused)}"]`)
        ?.focus();
    }, [focused]);

    // Initial autofocus is deferred a frame so a surrounding popover/dialog can first
    // record the previously focused element (for focus restoration on close).
    React.useEffect(() => {
      if (!autoFocus) return;
      shouldFocus.current = false;
      const frame = requestAnimationFrame(() => focusActiveDay());
      return () => cancelAnimationFrame(frame);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Keep focus on the active day after keyboard navigation re-renders the grid.
    React.useEffect(() => {
      if (!shouldFocus.current) return;
      shouldFocus.current = false;
      focusActiveDay();
    });

    const moveFocus = (next: Date) => {
      const target = clampDate(next, min, max);
      setFocused(target);
      shouldFocus.current = true;
      if (!isVisible(target)) {
        setMonthState(
          isBefore(target, month)
            ? startOfMonth(target)
            : startOfMonth(addMonths(target, -(numberOfMonths - 1))),
        );
      }
    };

    const selectDate = (d: Date) => {
      if (isDisabled(d)) return;
      setFocused(d);
      if (!isRange) {
        setValue(d);
      } else if (!range.start || range.end) {
        setValue({ start: d, end: null });
      } else {
        const [start, end] = isBefore(d, range.start) ? [d, range.start] : [range.start, d];
        setValue({ start, end });
        setHovered(null);
      }
      if (!isVisible(d)) setMonthState(startOfMonth(d));
    };

    const onKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, day: Date) => {
      const map: Record<string, () => Date> = {
        ArrowLeft: () => addDays(day, -1),
        ArrowRight: () => addDays(day, 1),
        ArrowUp: () => addDays(day, -7),
        ArrowDown: () => addDays(day, 7),
        Home: () => startOfWeek(day, weekStartsOn),
        End: () => endOfWeek(day, weekStartsOn),
        PageUp: () => (event.shiftKey ? addYears(day, -1) : addMonths(day, -1)),
        PageDown: () => (event.shiftKey ? addYears(day, 1) : addMonths(day, 1)),
      };
      const fn = map[event.key];
      if (fn) {
        event.preventDefault();
        const next = fn();
        moveFocus(next);
        if (isRange && range.start && !range.end) setHovered(next);
        return;
      }
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        selectDate(day);
      }
    };

    const goMonth = (delta: number) => {
      const nextMonth = addMonths(month, delta);
      setMonthState(nextMonth);
      const nextFocus = addMonths(focused, delta);
      setFocused(
        clampDate(
          isSameMonth(nextFocus, nextMonth) || numberOfMonths > 1 ? nextFocus : nextMonth,
          min,
          max,
        ),
      );
    };

    const prevDisabled = !!min && compareDays(addDays(month, -1), min) < 0;
    const nextDisabled = !!max && compareDays(addMonths(lastMonth, 1), max) > 0;

    const weekdayShort = getWeekdayNames(locale, weekStartsOn, 'short');
    const weekdayLong = getWeekdayNames(locale, weekStartsOn, 'long');
    const monthTitle = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' });
    const dayLabel = new Intl.DateTimeFormat(locale, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    // The single tab stop: the focused day if visible, otherwise the first enabled visible day.
    const tabStop = isVisible(focused) ? focused : clampDate(month, min, max);

    const previewEnd = isRange && range.start && !range.end ? hovered : null;
    const months = Array.from({ length: numberOfMonths }, (_, i) => addMonths(month, i));

    return (
      <div
        ref={(node) => {
          rootRef.current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) ref.current = node;
        }}
        className={cx('st-calendar', className)}
        data-mode={mode}
        data-months={numberOfMonths}
        {...rest}
      >
        <div className="st-calendar__header">
          <button
            type="button"
            className="st-calendar__nav"
            aria-label={labels.previousMonth}
            disabled={prevDisabled}
            onClick={() => goMonth(-1)}
          >
            <Icon name="chevron-left" size={16} />
          </button>
          <div className="st-calendar__titles" id={headingId} aria-live="polite">
            {months.map((m) => (
              <h2 key={toISODate(m)} className="st-calendar__title">
                {monthTitle.format(m)}
              </h2>
            ))}
          </div>
          <button
            type="button"
            className="st-calendar__nav"
            aria-label={labels.nextMonth}
            disabled={nextDisabled}
            onClick={() => goMonth(1)}
          >
            <Icon name="chevron-right" size={16} />
          </button>
        </div>
        <div className="st-calendar__months">
          {months.map((m) => {
            const weeks = getMonthGrid(m, weekStartsOn, numberOfMonths === 1);
            return (
              <table
                key={toISODate(m)}
                role="grid"
                className="st-calendar__grid"
                aria-label={monthTitle.format(m)}
              >
                <thead>
                  <tr>
                    {weekdayShort.map((w, i) => (
                      <th
                        key={w + i}
                        scope="col"
                        abbr={weekdayLong[i]}
                        className="st-calendar__weekday"
                      >
                        {w.slice(0, 2)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {weeks.map((week) => (
                    <tr key={toISODate(week[0]!)}>
                      {week.map((day) => {
                        const outside = !isSameMonth(day, m);
                        if (outside && (!showOutsideDays || numberOfMonths > 1)) {
                          return (
                            <td
                              key={toISODate(day)}
                              role="gridcell"
                              className="st-calendar__cell"
                              data-empty=""
                            />
                          );
                        }
                        const disabled = isDisabled(day);
                        const isSelected = isRange
                          ? isSameDay(day, range.start) || isSameDay(day, range.end)
                          : isSameDay(day, single);
                        const rangeEnd = range.end ?? previewEnd;
                        const inRange =
                          isRange &&
                          !!range.start &&
                          !!rangeEnd &&
                          isWithinRange(day, range.start, rangeEnd);
                        const [lo, hi] =
                          range.start && rangeEnd && isBefore(rangeEnd, range.start)
                            ? [rangeEnd, range.start]
                            : [range.start, rangeEnd];
                        const isStart = isRange && isSameDay(day, lo);
                        const isEnd = isRange && isSameDay(day, hi);
                        const isToday = isSameDay(day, today);
                        const extra = [
                          isToday && labels.today,
                          isRange && isSameDay(day, range.start) && labels.rangeStart,
                          isRange && isSameDay(day, range.end) && labels.rangeEnd,
                          !isRange && isSelected && labels.selected,
                          disabled && labels.unavailable,
                        ].filter(Boolean);
                        return (
                          <td
                            key={toISODate(day)}
                            role="gridcell"
                            aria-selected={
                              isSelected || (isRange && inRange && !!range.end) || undefined
                            }
                            className="st-calendar__cell"
                            data-in-range={inRange ? '' : undefined}
                            data-range-start={isStart && inRange ? '' : undefined}
                            data-range-end={isEnd && inRange ? '' : undefined}
                          >
                            <button
                              type="button"
                              className="st-calendar__day"
                              tabIndex={isSameDay(day, tabStop) ? 0 : -1}
                              aria-label={[dayLabel.format(day), ...extra].join(', ')}
                              aria-disabled={disabled || undefined}
                              aria-current={isToday ? 'date' : undefined}
                              data-date={toISODate(day)}
                              data-today={isToday ? '' : undefined}
                              data-selected={isSelected ? '' : undefined}
                              data-outside={outside ? '' : undefined}
                              data-disabled={disabled ? '' : undefined}
                              onClick={() => selectDate(day)}
                              onKeyDown={(e) => onKeyDown(e, day)}
                              onFocus={() => {
                                if (!isSameDay(focused, day)) setFocused(day);
                              }}
                              onMouseEnter={() => {
                                if (isRange && range.start && !range.end) setHovered(day);
                              }}
                            >
                              {day.getDate()}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            );
          })}
        </div>
      </div>
    );
  },
);
