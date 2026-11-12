'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { logicalKey } from '../../internal/direction.js';
import { useControllableState } from '../../internal/use-controllable-state.js';
import { Icon } from '../../icons/Icon.js';
import { useFormField } from '../form-field/FormField.js';

type Segment = 'hour' | 'minute' | 'second' | 'period';

interface TimeParts {
  hour: number | null; // 0 to 23
  minute: number | null;
  second: number | null;
}

export interface TimePickerLabels {
  hour: string;
  minute: string;
  second: string;
  period: string;
  am: string;
  pm: string;
  clear: string;
}

const defaultLabels: TimePickerLabels = {
  hour: 'Hours',
  minute: 'Minutes',
  second: 'Seconds',
  period: 'AM/PM',
  am: 'AM',
  pm: 'PM',
  clear: 'Clear time',
};

export interface TimePickerProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'defaultValue' | 'onChange'
> {
  /** Time as 24-hour `HH:MM` or `HH:MM:SS`; null when incomplete. */
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
  /** 12 or 24 hour display. Defaults to the locale's convention. */
  hourCycle?: 12 | 24;
  locale?: string;
  /** Arrow-key increment for minutes. Default 1. */
  step?: number;
  showSeconds?: boolean;
  /** Hidden input name, submits `HH:MM(:SS)`. */
  name?: string;
  disabled?: boolean;
  required?: boolean;
  invalid?: boolean;
  size?: 'sm' | 'md' | 'lg';
  clearable?: boolean;
  labels?: Partial<TimePickerLabels>;
}

function parse(value: string | null | undefined): TimeParts {
  const m = value ? /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(value) : null;
  if (!m) return { hour: null, minute: null, second: null };
  const [h, mi, s] = [Number(m[1]), Number(m[2]), m[3] ? Number(m[3]) : 0];
  if (h > 23 || mi > 59 || s > 59) return { hour: null, minute: null, second: null };
  return { hour: h, minute: mi, second: s };
}

const pad = (n: number) => String(n).padStart(2, '0');

function localeHourCycle(locale?: string): 12 | 24 {
  try {
    const hc = new Intl.DateTimeFormat(locale, { hour: 'numeric' }).resolvedOptions().hourCycle;
    return hc === 'h11' || hc === 'h12' ? 12 : 24;
  } catch {
    return 24;
  }
}

/** Enter a time of day with keyboard-friendly hour/minute segments. */
export const TimePicker = React.forwardRef<HTMLDivElement, TimePickerProps>(function TimePicker(
  {
    value: valueProp,
    defaultValue = null,
    onValueChange,
    hourCycle: hourCycleProp,
    locale,
    step = 1,
    showSeconds = false,
    name,
    disabled: disabledProp,
    required: requiredProp,
    invalid,
    size = 'md',
    clearable = false,
    labels: labelsProp,
    className,
    ...props
  },
  ref,
) {
  const labels = { ...defaultLabels, ...labelsProp };
  const field = useFormField();
  const disabled = disabledProp ?? field?.disabled ?? false;
  const required = requiredProp ?? field?.required ?? false;
  const isInvalid = invalid ?? field?.invalid ?? false;
  const hourCycle = hourCycleProp ?? localeHourCycle(locale);
  const [value, setValue] = useControllableState<string | null>({
    value: valueProp,
    defaultValue,
    onChange: onValueChange,
  });
  const [parts, setParts] = React.useState<TimeParts>(() => parse(value));
  const [period, setPeriod] = React.useState<'am' | 'pm'>(() =>
    (parse(value).hour ?? 0) >= 12 ? 'pm' : 'am',
  );
  const buffer = React.useRef<{ segment: Segment | null; text: string }>({
    segment: null,
    text: '',
  });
  const segmentRefs = React.useRef<Partial<Record<Segment, HTMLDivElement | null>>>({});

  // Sync from controlled value changes.
  React.useEffect(() => {
    const next = parse(value);
    const complete = (p: TimeParts) =>
      p.hour !== null && p.minute !== null && (!showSeconds || p.second !== null);
    setParts((prev) => {
      if (!value && !complete(prev)) return prev;
      return next;
    });
    if (next.hour !== null) setPeriod(next.hour >= 12 ? 'pm' : 'am');
  }, [value, showSeconds]);

  const segments: Segment[] = [
    'hour',
    'minute',
    ...(showSeconds ? (['second'] as const) : []),
    ...(hourCycle === 12 ? (['period'] as const) : []),
  ];

  const emit = (next: TimeParts) => {
    setParts(next);
    const complete =
      next.hour !== null && next.minute !== null && (!showSeconds || next.second !== null);
    setValue(
      complete
        ? `${pad(next.hour!)}:${pad(next.minute!)}${showSeconds ? `:${pad(next.second ?? 0)}` : ''}`
        : null,
    );
  };

  const focusSegment = (seg: Segment | undefined) => {
    if (seg) segmentRefs.current[seg]?.focus();
  };
  const neighbour = (seg: Segment, dir: 1 | -1) => segments[segments.indexOf(seg) + dir];

  // Display hour in the chosen cycle.
  const displayHour = (h: number | null) => {
    if (h === null) return null;
    if (hourCycle === 24) return h;
    const twelve = h % 12;
    return twelve === 0 ? 12 : twelve;
  };
  const toHour24 = (display: number, p: 'am' | 'pm') =>
    hourCycle === 24 ? display : (display % 12) + (p === 'pm' ? 12 : 0);

  const setSegment = (seg: Segment, raw: number | null) => {
    if (seg === 'hour') emit({ ...parts, hour: raw === null ? null : toHour24(raw, period) });
    else if (seg === 'minute') emit({ ...parts, minute: raw });
    else if (seg === 'second') emit({ ...parts, second: raw });
  };

  const togglePeriod = (next?: 'am' | 'pm') => {
    const p = next ?? (period === 'am' ? 'pm' : 'am');
    setPeriod(p);
    if (parts.hour !== null) emit({ ...parts, hour: (parts.hour % 12) + (p === 'pm' ? 12 : 0) });
  };

  const meta = (seg: Exclude<Segment, 'period'>) => {
    if (seg === 'hour')
      return hourCycle === 12
        ? { min: 1, max: 12, current: displayHour(parts.hour) }
        : { min: 0, max: 23, current: parts.hour };
    if (seg === 'minute') return { min: 0, max: 59, current: parts.minute };
    return { min: 0, max: 59, current: parts.second };
  };

  const onSegmentKeyDown = (seg: Segment, e: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    // Segments follow the inline direction, so horizontal arrows swap in RTL.
    const key = logicalKey(e.key, e.currentTarget);
    if (key === 'ArrowLeft') {
      e.preventDefault();
      focusSegment(neighbour(seg, -1));
      return;
    }
    if (key === 'ArrowRight') {
      e.preventDefault();
      focusSegment(neighbour(seg, 1));
      return;
    }
    if (seg === 'period') {
      if (['ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
        togglePeriod();
      } else if (e.key.toLowerCase() === labels.am[0]!.toLowerCase()) togglePeriod('am');
      else if (e.key.toLowerCase() === labels.pm[0]!.toLowerCase()) togglePeriod('pm');
      return;
    }
    const { min, max, current } = meta(seg);
    const inc = seg === 'minute' ? step : 1;
    const span = max - min + 1;
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      buffer.current = { segment: null, text: '' };
      const dir = e.key === 'ArrowUp' ? 1 : -1;
      let next: number;
      if (current === null)
        next = dir === 1 ? min : max - ((max - min + 1) % inc === 0 ? inc - 1 : 0);
      else next = ((((current - min + dir * inc) % span) + span) % span) + min;
      if (seg === 'minute' && inc > 1 && current !== null)
        next = (Math.round(next / inc) * inc) % 60;
      setSegment(seg, next);
      return;
    }
    if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault();
      setSegment(seg, e.key === 'Home' ? min : max);
      return;
    }
    if (e.key === 'Backspace' || e.key === 'Delete') {
      e.preventDefault();
      buffer.current = { segment: null, text: '' };
      setSegment(seg, null);
      return;
    }
    if (/^\d$/.test(e.key)) {
      e.preventDefault();
      const b = buffer.current;
      const text = b.segment === seg ? b.text + e.key : e.key;
      let num = Number(text);
      const maxFirstDigit = Math.floor(max / 10);
      if (text.length === 1) {
        // Single digit: commit; advance if no two-digit value could start with it.
        if (seg === 'hour' && hourCycle === 12 && num === 0) num = 12;
        setSegment(seg, Math.min(Math.max(num, min), max));
        if (num > maxFirstDigit) {
          buffer.current = { segment: null, text: '' };
          focusSegment(neighbour(seg, 1));
        } else {
          buffer.current = { segment: seg, text };
        }
      } else {
        if (num > max) num = Number(e.key);
        setSegment(seg, Math.min(Math.max(num, min), max));
        buffer.current = { segment: null, text: '' };
        focusSegment(neighbour(seg, 1));
      }
    }
  };

  const labelledBy =
    field?.labelId && props['aria-label'] === undefined ? field.labelId : undefined;
  const describedBy = field
    ? [field.hasDescription && field.descriptionId, field.hasError && field.errorId]
        .filter(Boolean)
        .join(' ') || undefined
    : undefined;
  const hasAny = parts.hour !== null || parts.minute !== null || parts.second !== null;

  const renderSegment = (seg: Segment) => {
    if (seg === 'period') {
      return (
        <div
          key={seg}
          ref={(el) => {
            segmentRefs.current[seg] = el;
          }}
          role="spinbutton"
          tabIndex={disabled ? -1 : 0}
          aria-label={labels.period}
          aria-valuemin={0}
          aria-valuemax={1}
          aria-valuenow={period === 'am' ? 0 : 1}
          aria-valuetext={period === 'am' ? labels.am : labels.pm}
          aria-disabled={disabled || undefined}
          className="st-time-picker__segment"
          data-segment="period"
          onKeyDown={(e) => onSegmentKeyDown(seg, e)}
          onClick={() => focusSegment(seg)}
        >
          {period === 'am' ? labels.am : labels.pm}
        </div>
      );
    }
    const { min, max, current } = meta(seg);
    return (
      <React.Fragment key={seg}>
        {seg !== 'hour' && (
          <span className="st-time-picker__sep" aria-hidden="true">
            :
          </span>
        )}
        <div
          ref={(el) => {
            segmentRefs.current[seg] = el;
          }}
          role="spinbutton"
          tabIndex={disabled ? -1 : 0}
          aria-label={labels[seg]}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={current ?? undefined}
          aria-valuetext={current === null ? 'Empty' : pad(current)}
          aria-disabled={disabled || undefined}
          aria-required={required || undefined}
          aria-invalid={isInvalid || undefined}
          className="st-time-picker__segment"
          data-segment={seg}
          data-placeholder={current === null ? '' : undefined}
          onKeyDown={(e) => onSegmentKeyDown(seg, e)}
          onBlur={() => {
            buffer.current = { segment: null, text: '' };
          }}
        >
          {current === null ? '--' : pad(current)}
        </div>
      </React.Fragment>
    );
  };

  return (
    <div
      ref={ref}
      role="group"
      id={field?.id}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      className={cx('st-input st-time-picker', className)}
      data-size={size}
      data-invalid={isInvalid ? '' : undefined}
      data-disabled={disabled ? '' : undefined}
      onClick={(e) => {
        if (e.target === e.currentTarget)
          focusSegment(
            segments.find((s) => s !== 'period' && meta(s as 'hour').current === null) ?? 'hour',
          );
      }}
      {...props}
    >
      <Icon name="clock" size={16} className="st-time-picker__icon" />
      <div className="st-time-picker__segments">
        {segments.filter((s) => s !== 'period').map(renderSegment)}
        {hourCycle === 12 && renderSegment('period')}
      </div>
      {clearable && hasAny && !disabled && (
        <button
          type="button"
          className="st-time-picker__clear"
          aria-label={labels.clear}
          onClick={() => emit({ hour: null, minute: null, second: null })}
        >
          <Icon name="x" size={14} />
        </button>
      )}
      {name && <input type="hidden" name={name} value={value ?? ''} />}
    </div>
  );
});
