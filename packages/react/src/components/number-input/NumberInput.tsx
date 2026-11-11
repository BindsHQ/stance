'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { useComposedRefs } from '../../internal/refs.js';
import { useControllableState } from '../../internal/use-controllable-state.js';
import { Icon } from '../../icons/Icon.js';
import { useFormFieldControl } from '../form-field/FormField.js';

export interface NumberInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'value' | 'defaultValue' | 'size' | 'type' | 'min' | 'max' | 'step' | 'prefix'
> {
  value?: number | null;
  defaultValue?: number | null;
  onValueChange?: (value: number | null) => void;
  min?: number;
  max?: number;
  /** Default 1. */
  step?: number;
  /** Multiplier for PageUp/PageDown. Default 10. */
  largeStep?: number;
  /** Decimal places to round to. Inferred from `step` when omitted. */
  precision?: number;
  /** Format the displayed value, e.g. currency. Parsing strips non-numeric characters. */
  format?: (value: number) => string;
  size?: 'sm' | 'md' | 'lg';
  invalid?: boolean;
  /** Hide the increment/decrement buttons. */
  hideStepper?: boolean;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  /** Labels for the stepper buttons. */
  incrementLabel?: string;
  decrementLabel?: string;
}

const decimals = (n: number) => (String(n).split('.')[1] ?? '').length;

/** Numeric entry with stepper buttons, implementing the WAI-ARIA spinbutton pattern. */
export const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  function NumberInput(
    {
      value: valueProp,
      defaultValue = null,
      onValueChange,
      min,
      max,
      step = 1,
      largeStep = 10,
      precision,
      format,
      size = 'md',
      invalid,
      hideStepper = false,
      prefix,
      suffix,
      incrementLabel = 'Increase',
      decrementLabel = 'Decrease',
      className,
      onKeyDown,
      onBlur,
      ...rest
    },
    forwardedRef,
  ) {
    const [value, setValue] = useControllableState<number | null>({
      value: valueProp,
      defaultValue,
      onChange: onValueChange,
    });
    const props = useFormFieldControl({
      ...rest,
      ...(invalid !== undefined && { 'aria-invalid': invalid }),
    });
    const places = precision ?? decimals(step);
    const display = (v: number | null) =>
      v === null ? '' : format ? format(v) : v.toFixed(places);
    const [draft, setDraft] = React.useState<string | null>(null);
    const ref = React.useRef<HTMLInputElement>(null);
    const composed = useComposedRefs(forwardedRef, ref);

    const clamp = (n: number) => {
      let v = Math.round(n * 10 ** places) / 10 ** places;
      if (min !== undefined) v = Math.max(min, v);
      if (max !== undefined) v = Math.min(max, v);
      return v;
    };
    const parse = (s: string): number | null => {
      const cleaned = s.replace(/[^0-9.-]/g, '');
      if (cleaned === '' || cleaned === '-' || cleaned === '.') return null;
      const n = Number(cleaned);
      return Number.isFinite(n) ? n : null;
    };
    const commit = () => {
      if (draft === null) return;
      const parsed = parse(draft);
      setValue(parsed === null ? null : clamp(parsed));
      setDraft(null);
    };
    const stepBy = (delta: number) => {
      if (props.readOnly || props.disabled) return;
      const base =
        draft !== null
          ? (parse(draft) ?? 0)
          : (value ?? (min !== undefined && min > 0 ? min - delta : 0));
      setDraft(null);
      setValue(clamp(base + delta));
    };

    const atMin = min !== undefined && value !== null && value <= min;
    const atMax = max !== undefined && value !== null && value >= max;
    const isInvalid = String(props['aria-invalid']) === 'true';

    return (
      <div
        className="st-input st-number-input"
        data-size={size}
        data-invalid={isInvalid ? '' : undefined}
        data-disabled={props.disabled ? '' : undefined}
        data-readonly={props.readOnly ? '' : undefined}
      >
        {prefix != null && <span className="st-input__affix">{prefix}</span>}
        <input
          ref={composed}
          type="text"
          inputMode={places > 0 ? 'decimal' : 'numeric'}
          role="spinbutton"
          autoComplete="off"
          aria-valuenow={value ?? undefined}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuetext={value !== null && format ? format(value) : undefined}
          className={cx('st-input__control st-number-input__control', className)}
          value={draft ?? display(value)}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={(e) => {
            commit();
            onBlur?.(e);
          }}
          onKeyDown={(e) => {
            onKeyDown?.(e);
            if (e.defaultPrevented) return;
            const keys: Record<string, () => void> = {
              ArrowUp: () => stepBy(step),
              ArrowDown: () => stepBy(-step),
              PageUp: () => stepBy(step * largeStep),
              PageDown: () => stepBy(-step * largeStep),
              Home: () => min !== undefined && (setDraft(null), setValue(min)),
              End: () => max !== undefined && (setDraft(null), setValue(max)),
              Enter: () => commit(),
            };
            const action = keys[e.key];
            if (action) {
              if (e.key !== 'Enter') e.preventDefault();
              action();
            }
          }}
          {...props}
        />
        {suffix != null && <span className="st-input__affix">{suffix}</span>}
        {!hideStepper && (
          <span className="st-number-input__stepper">
            <button
              type="button"
              tabIndex={-1}
              aria-label={incrementLabel}
              aria-controls={props.id}
              className="st-number-input__step"
              disabled={props.disabled || props.readOnly || atMax}
              onPointerDown={(e) => e.preventDefault()}
              onClick={() => {
                stepBy(step);
                ref.current?.focus();
              }}
            >
              <Icon name="chevron-up" size={12} strokeWidth={2.25} />
            </button>
            <button
              type="button"
              tabIndex={-1}
              aria-label={decrementLabel}
              aria-controls={props.id}
              className="st-number-input__step"
              disabled={props.disabled || props.readOnly || atMin}
              onPointerDown={(e) => e.preventDefault()}
              onClick={() => {
                stepBy(-step);
                ref.current?.focus();
              }}
            >
              <Icon name="chevron-down" size={12} strokeWidth={2.25} />
            </button>
          </span>
        )}
      </div>
    );
  },
);
