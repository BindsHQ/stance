'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { getDateFieldOrder, parseDateInput, toISODate } from '../../internal/date.js';
import { useControllableState } from '../../internal/use-controllable-state.js';
import { Icon } from '../../icons/Icon.js';
import { Calendar } from '../calendar/Calendar.js';
import { useFormFieldControl } from '../form-field/FormField.js';
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from '../popover/Popover.js';

export interface DatePickerLabels {
  openCalendar: string;
  clear: string;
  calendar: string;
}

const defaultLabels: DatePickerLabels = {
  openCalendar: 'Choose date',
  clear: 'Clear date',
  calendar: 'Choose date',
};

export interface DatePickerProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'value' | 'defaultValue' | 'size' | 'min' | 'max' | 'type'
> {
  value?: Date | null;
  defaultValue?: Date | null;
  onValueChange?: (value: Date | null) => void;
  /** Submits the value as ISO `yyyy-mm-dd` in a hidden input. */
  name?: string;
  min?: Date | null;
  max?: Date | null;
  isDateDisabled?: (date: Date) => boolean;
  /** Locale for parsing, display and calendar names. */
  locale?: string;
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  size?: 'sm' | 'md' | 'lg';
  /** Show a clear button when a date is set. Default true. */
  clearable?: boolean;
  invalid?: boolean;
  /** Override "today" (tests, time zones). */
  today?: Date;
  labels?: Partial<DatePickerLabels>;
  /** Class for the outer field box. */
  wrapperClassName?: string;
}

function placeholderFor(locale?: string) {
  const map = { day: 'dd', month: 'mm', year: 'yyyy' } as const;
  const sample = new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).formatToParts(new Date(2026, 10, 23));
  const sep = sample.find((p) => p.type === 'literal')?.value ?? '/';
  return getDateFieldOrder(locale)
    .map((f) => map[f])
    .join(sep);
}

/** A date field you can type into or pick from a calendar. */
export const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(function DatePicker(
  {
    value: valueProp,
    defaultValue = null,
    onValueChange,
    name,
    min,
    max,
    isDateDisabled,
    locale,
    weekStartsOn,
    size = 'md',
    clearable = true,
    invalid,
    today,
    labels: labelsProp,
    wrapperClassName,
    placeholder,
    className,
    onBlur,
    onKeyDown,
    ...rest
  },
  ref,
) {
  const labels = { ...defaultLabels, ...labelsProp };
  const [value, setValue] = useControllableState<Date | null>({
    value: valueProp,
    defaultValue,
    onChange: onValueChange,
  });
  const [open, setOpen] = React.useState(false);
  const format = React.useMemo(
    () => new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', year: 'numeric' }),
    [locale],
  );
  const [text, setText] = React.useState(value ? format.format(value) : '');
  const [parseError, setParseError] = React.useState(false);
  React.useEffect(() => {
    setText(value ? format.format(value) : '');
    setParseError(false);
  }, [value, format]);

  const props = useFormFieldControl({
    ...rest,
    ...(invalid !== undefined && { 'aria-invalid': invalid }),
  });
  const isInvalid =
    parseError || props['aria-invalid'] === true || String(props['aria-invalid']) === 'true';

  const commitText = () => {
    const trimmed = text.trim();
    if (!trimmed) {
      if (value) setValue(null);
      setParseError(false);
      return;
    }
    const parsed = parseDateInput(trimmed, locale);
    const outOfRange =
      parsed &&
      ((min && parsed < new Date(min.getFullYear(), min.getMonth(), min.getDate())) ||
        (max && parsed > max) ||
        isDateDisabled?.(parsed));
    if (parsed && !outOfRange) {
      setValue(parsed);
      setText(format.format(parsed));
      setParseError(false);
    } else {
      setParseError(true);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div
          className={cx('st-input st-date-picker', wrapperClassName)}
          data-size={size}
          data-invalid={isInvalid ? '' : undefined}
          data-disabled={props.disabled ? '' : undefined}
        >
          <input
            ref={ref}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            className={cx('st-input__control', className)}
            placeholder={placeholder ?? placeholderFor(locale)}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={(e) => {
              commitText();
              onBlur?.(e);
            }}
            onKeyDown={(e) => {
              onKeyDown?.(e);
              if (e.defaultPrevented) return;
              if (e.key === 'Enter') commitText();
              if (e.key === 'ArrowDown' && e.altKey) {
                e.preventDefault();
                setOpen(true);
              }
            }}
            {...props}
            aria-invalid={isInvalid || undefined}
          />
          {clearable && value && !props.disabled && !props.readOnly && (
            <button
              type="button"
              className="st-date-picker__button"
              aria-label={labels.clear}
              onClick={() => setValue(null)}
            >
              <Icon name="x" size={14} />
            </button>
          )}
          <PopoverTrigger
            className="st-date-picker__button"
            aria-label={labels.openCalendar}
            disabled={props.disabled || props.readOnly}
          >
            <Icon name="calendar" size={16} />
          </PopoverTrigger>
          {name && <input type="hidden" name={name} value={value ? toISODate(value) : ''} />}
        </div>
      </PopoverAnchor>
      <PopoverContent
        align="start"
        autoFocus={false}
        aria-label={labels.calendar}
        className="st-date-picker__popover"
      >
        <Calendar
          autoFocus
          value={value}
          onValueChange={(d) => {
            setValue(d);
            setOpen(false);
          }}
          {...(min !== undefined && { min })}
          {...(max !== undefined && { max })}
          {...(isDateDisabled && { isDateDisabled })}
          {...(locale && { locale })}
          {...(weekStartsOn !== undefined && { weekStartsOn })}
          {...(today && { today })}
        />
      </PopoverContent>
    </Popover>
  );
});
