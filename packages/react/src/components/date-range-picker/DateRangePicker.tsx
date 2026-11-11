'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { isSameDay, toISODate, type DateRange } from '../../internal/date.js';
import { useControllableState } from '../../internal/use-controllable-state.js';
import { Icon } from '../../icons/Icon.js';
import { Calendar } from '../calendar/Calendar.js';
import { useFormFieldControl } from '../form-field/FormField.js';
import { Popover, PopoverContent, PopoverTrigger } from '../popover/Popover.js';

export interface DateRangePreset {
  label: string;
  /** Computes the range when chosen; receives "today". */
  range: (today: Date) => DateRange;
}

export interface DateRangePickerLabels {
  placeholder: string;
  calendar: string;
  presets: string;
  clear: string;
}

const defaultLabels: DateRangePickerLabels = {
  placeholder: 'Select dates',
  calendar: 'Choose date range',
  presets: 'Quick ranges',
  clear: 'Clear',
};

export interface DateRangePickerProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'value' | 'defaultValue' | 'onChange'
> {
  value?: DateRange;
  defaultValue?: DateRange;
  onValueChange?: (value: DateRange) => void;
  /** Hidden input names for form submission (ISO dates). */
  startName?: string;
  endName?: string;
  min?: Date | null;
  max?: Date | null;
  isDateDisabled?: (date: Date) => boolean;
  locale?: string;
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  /** Shortcut ranges shown beside the calendar, e.g. "Last 7 days". */
  presets?: DateRangePreset[];
  /** Months shown. Default 2 (1 on narrow screens is handled by wrapping). */
  numberOfMonths?: 1 | 2;
  size?: 'sm' | 'md' | 'lg';
  invalid?: boolean;
  today?: Date;
  labels?: Partial<DateRangePickerLabels>;
}

const EMPTY: DateRange = { start: null, end: null };

/** Picks a start and end date, with optional preset ranges. */
export const DateRangePicker = React.forwardRef<HTMLButtonElement, DateRangePickerProps>(
  function DateRangePicker(
    {
      value: valueProp,
      defaultValue = EMPTY,
      onValueChange,
      startName,
      endName,
      min,
      max,
      isDateDisabled,
      locale,
      weekStartsOn,
      presets,
      numberOfMonths = 2,
      size = 'md',
      invalid,
      today: todayProp,
      labels: labelsProp,
      className,
      ...rest
    },
    ref,
  ) {
    const labels = { ...defaultLabels, ...labelsProp };
    const [value, setValue] = useControllableState<DateRange>({
      value: valueProp,
      defaultValue,
      onChange: onValueChange,
    });
    const [draft, setDraft] = React.useState<DateRange>(value);
    const [open, setOpen] = React.useState(false);
    const today = todayProp ?? new Date();
    const props = useFormFieldControl({
      ...rest,
      ...(invalid !== undefined && { 'aria-invalid': invalid }),
    });
    const isInvalid = props['aria-invalid'] === true || String(props['aria-invalid']) === 'true';
    const fmt = new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    React.useEffect(() => {
      if (open) setDraft(value);
    }, [open, value]);

    const display =
      value.start && value.end
        ? fmt.formatRange
          ? fmt.formatRange(value.start, value.end)
          : `${fmt.format(value.start)} – ${fmt.format(value.end)}`
        : value.start
          ? `${fmt.format(value.start)} –`
          : null;

    const commit = (range: DateRange) => {
      setValue(range);
      if (range.start && range.end) setOpen(false);
    };

    const activePreset = presets?.find((p) => {
      const r = p.range(today);
      return isSameDay(r.start, value.start) && isSameDay(r.end, value.end);
    });

    // An aria-label would replace the visible dates in the accessible name (WCAG 2.5.3 Label in Name).
    // Render it as visually hidden text instead, so the name reads "<label>, <visible value>".
    const { 'aria-label': ariaLabel, ...triggerProps } = props;

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          ref={ref}
          className={cx('st-input st-date-range-picker', className)}
          data-size={size}
          data-invalid={isInvalid ? '' : undefined}
          data-disabled={props.disabled ? '' : undefined}
          data-placeholder={display ? undefined : ''}
          {...triggerProps}
        >
          <Icon name="calendar" size={16} className="st-date-range-picker__icon" />
          {ariaLabel && <span className="st-sr-only">{ariaLabel}, </span>}
          <span className="st-date-range-picker__value">{display ?? labels.placeholder}</span>
          <Icon name="chevron-down" size={14} className="st-date-range-picker__chevron" />
        </PopoverTrigger>
        {startName && (
          <input type="hidden" name={startName} value={value.start ? toISODate(value.start) : ''} />
        )}
        {endName && (
          <input type="hidden" name={endName} value={value.end ? toISODate(value.end) : ''} />
        )}
        <PopoverContent
          align="start"
          autoFocus={false}
          aria-label={labels.calendar}
          className="st-date-range-picker__popover"
        >
          <div className="st-date-range-picker__layout">
            {presets && presets.length > 0 && (
              <div
                role="group"
                aria-label={labels.presets}
                className="st-date-range-picker__presets"
              >
                {presets.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    className="st-date-range-picker__preset"
                    aria-pressed={activePreset === p}
                    onClick={() => commit(p.range(today))}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            )}
            <div className="st-date-range-picker__calendar">
              <Calendar
                mode="range"
                autoFocus
                numberOfMonths={numberOfMonths}
                value={draft}
                onValueChange={(r) => {
                  setDraft(r);
                  if (r.start && r.end) commit(r);
                }}
                {...(min !== undefined && { min })}
                {...(max !== undefined && { max })}
                {...(isDateDisabled && { isDateDisabled })}
                {...(locale && { locale })}
                {...(weekStartsOn !== undefined && { weekStartsOn })}
                {...(todayProp && { today: todayProp })}
              />
              {(value.start || draft.start) && (
                <div className="st-date-range-picker__footer">
                  <button
                    type="button"
                    className="st-date-range-picker__clear"
                    onClick={() => {
                      setDraft(EMPTY);
                      setValue(EMPTY);
                    }}
                  >
                    {labels.clear}
                  </button>
                </div>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  },
);
